/**
 * Self-contained OAuth handler for libraries
 * Supports multiple redirect strategies
 */

import React from "react";

export interface OAuthConfig {
  authUrl: string;
  redirectUri?: string; // Optional: validate this is same-origin
  popupWidth?: number;
  popupHeight?: number;
  timeout?: number;
  extractParams?: (url: URL) => any;
}

export interface OAuthResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Validates that a redirect URI is same-origin
 */
function validateRedirectUri(redirectUri: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const redirectUrl = new URL(redirectUri);
    const currentOrigin = window.location.origin;

    if (redirectUrl.origin !== currentOrigin) {
      return {
        valid: false,
        error: `OAuth redirect URL must be same-origin. Expected origin: ${currentOrigin}, but got: ${redirectUrl.origin}`,
      };
    }

    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: `Invalid redirect URI format: ${redirectUri}`,
    };
  }
}

/**
 * Extracts redirect URI from auth URL if present
 */
function extractRedirectUriFromAuthUrl(authUrl: string): string | null {
  try {
    const url = new URL(authUrl);
    return url.searchParams.get("redirect_uri") || null;
  } catch (e) {
    return null;
  }
}

/**
 * Opens OAuth popup and handles the flow using same-origin polling only.
 * Only works with same-origin redirect URLs for security.
 */
export async function handleOAuthFlow(
  config: OAuthConfig
): Promise<OAuthResult> {
  // Validate redirect URI if provided explicitly
  if (config.redirectUri) {
    const validation = validateRedirectUri(config.redirectUri);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }
  }

  // Also check if redirect_uri is in the authUrl and validate it
  const redirectUriFromUrl = extractRedirectUriFromAuthUrl(config.authUrl);
  if (redirectUriFromUrl) {
    const validation = validateRedirectUri(redirectUriFromUrl);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }
  }

  return new Promise((resolve) => {
    const width = config.popupWidth || 600;
    const height = config.popupHeight || 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Open popup with the OAuth URL
    const popup = window.open(
      config.authUrl,
      "oauth_popup",
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );

    if (!popup) {
      resolve({
        success: false,
        error: "Failed to open popup. Please allow popups for this site.",
      });
      return;
    }

    const timeout = config.timeout || 300000;
    let isResolved = false;

    const resolveOnce = (result: OAuthResult) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(result);
      }
    };

    // Set up timeout
    const timeoutId = setTimeout(() => {
      popup.close();
      resolveOnce({
        success: false,
        error: "Authentication timed out",
      });
    }, timeout);

    // URL polling for same-origin redirects only
    const pollInterval = setInterval(() => {
      try {
        // Check if popup is closed
        if (popup.closed) {
          resolveOnce({
            success: false,
            error: "Authentication was cancelled",
          });
          return;
        }

        // Try to access popup URL
        let popupUrl: URL;
        try {
          // This will throw if cross-origin (e.g., still on OAuth provider's domain)
          popupUrl = new URL(popup.location.href);
        } catch (e) {
          // Cross-origin access blocked - this is expected while on OAuth provider
          // Keep polling until we redirect back to same-origin
          return;
        }

        // Successfully accessed URL - now check if it's same-origin
        if (popupUrl.origin !== window.location.origin) {
          // We can read the URL but it's not same-origin
          // This means the browser allowed access (maybe data: or about: URL)
          // Keep polling to see if it redirects to our domain
          return;
        }

        // We're on same-origin now! Check if URL has authentication parameters
        const hasAuthParams =
          popupUrl.searchParams.has("code") ||
          popupUrl.searchParams.has("error") ||
          popupUrl.hash.includes("access_token") ||
          popupUrl.hash.includes("code") ||
          popupUrl.hash.includes("error");

        if (hasAuthParams) {
          popup.close();

          let result: any;
          if (config.extractParams) {
            result = config.extractParams(popupUrl);
          } else {
            result = {};

            // Extract from query params
            popupUrl.searchParams.forEach((value, key) => {
              result[key] = value;
            });

            // Extract from hash/fragment
            if (popupUrl.hash) {
              const hashParams = new URLSearchParams(popupUrl.hash.slice(1));
              hashParams.forEach((value, key) => {
                result[key] = value;
              });
            }
          }

          if (result.error) {
            resolveOnce({
              success: false,
              error: result.error_description || result.error,
            });
          } else {
            resolveOnce({
              success: true,
              data: result,
            });
          }
        }
        // If we're same-origin but no auth params yet, keep polling
      } catch (e) {
        // Ignore any other errors during polling
      }
    }, 250); // Poll every 250ms

    const cleanup = () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  });
}

/**
 * Updated OAuth render function for flow-hydration.tsx
 */
export function createOAuthRender(config: any) {
  return ({ context, onComplete, onError }: any) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleOAuth = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const authUrl =
          typeof config.authUrl === "function"
            ? config.authUrl(context)
            : config.authUrl;

        const result = await handleOAuthFlow({
          authUrl,
          redirectUri: config.redirectUri,
          popupWidth: config.popupWidth,
          popupHeight: config.popupHeight,
          timeout: config.timeout,
          extractParams: config.extractParams,
        });

        setIsLoading(false);

        if (result.success) {
          onComplete(result.data);
        } else {
          const errorMessage = result.error || "Authentication failed";
          setError(errorMessage);
          if (onError) {
            onError(errorMessage);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        setIsLoading(false);
        if (onError) {
          onError(errorMessage);
        }
      }
    };

    return React.createElement(
      "div",
      { className: "w-full max-w-md mx-auto p-6" },
      config.title &&
        React.createElement(
          "h2",
          { className: "text-2xl font-bold mb-2" },
          config.title
        ),
      config.description &&
        React.createElement(
          "p",
          { className: "text-muted-foreground mb-6" },
          config.description
        ),
      error &&
        React.createElement(
          "div",
          {
            className:
              "mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm",
          },
          error
        ),
      React.createElement(
        "button",
        {
          onClick: handleOAuth,
          disabled: isLoading,
          className:
            "w-full px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50",
        },
        isLoading
          ? "Waiting for authentication..."
          : config.buttonLabel || "Connect"
      )
    );
  };
}
