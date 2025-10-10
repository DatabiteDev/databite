import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FlowBuilder, createFlow } from "../flow-builder/flow-builder";
import { z } from "zod";

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}

// Mock fetch for HTTP tests
global.fetch = jest.fn();

describe("FlowBuilder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a FlowBuilder with a name", () => {
      const builder = new FlowBuilder("test-flow");
      expect(builder).toBeDefined();
    });
  });

  describe("block", () => {
    it("should add a custom block", () => {
      const builder = new FlowBuilder("test-flow");
      const result = builder.block("testBlock", async () => {
        return { result: "success" };
      });

      expect(result).toBeDefined();
    });

    it("should add a block with render function", () => {
      const builder = new FlowBuilder("test-flow");
      const render = ({ onComplete }: any) => (
        <button onClick={() => onComplete("test")}>Test</button>
      );

      const result = builder.block("testBlock", async () => "test", {
        render,
        requiresInteraction: true,
      });

      expect(result).toBeDefined();
    });
  });

  describe("form", () => {
    it("should add a form block", () => {
      const builder = new FlowBuilder("test-flow");
      const result = builder.form("userForm", {
        fields: [
          { name: "name", label: "Name", required: true },
          { name: "email", label: "Email", type: "email" },
        ],
        title: "User Information",
        description: "Please fill out the form",
      });

      expect(result).toBeDefined();
    });

    it("should render form with correct fields", () => {
      const builder = new FlowBuilder("test-flow");
      const flow = builder
        .form("userForm", {
          fields: [
            { name: "name", label: "Name", required: true },
            { name: "email", label: "Email", type: "email" },
          ],
          title: "User Information",
        })
        .build();

      const block = flow.blocks.userForm;
      expect(block).toBeDefined();
      expect(block.requiresInteraction).toBe(true);
      expect(block.render).toBeDefined();
    });

    it("should handle form submission", async () => {
      const builder = new FlowBuilder("test-flow");
      const flow = builder
        .form("userForm", {
          fields: [
            { name: "name", label: "Name", required: true },
            { name: "email", label: "Email", type: "email" },
          ],
        })
        .build();

      const block = flow.blocks.userForm;
      const mockOnComplete = jest.fn();
      const mockOnError = jest.fn();

      render(
        <div>
          {block.render!({
            onComplete: mockOnComplete,
            onError: mockOnError,
            context: {},
          })}
        </div>
      );

      // Fill out the form
      const nameInput = screen.getByLabelText("Name");
      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", { name: "Continue" });

      fireEvent.change(nameInput, { target: { value: "John Doe" } });
      fireEvent.change(emailInput, { target: { value: "john@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith({
          name: "John Doe",
          email: "john@example.com",
        });
      });
    });

    it("should validate required fields", async () => {
      const builder = new FlowBuilder("test-flow");
      const flow = builder
        .form("userForm", {
          fields: [
            { name: "name", label: "Name", required: true },
            { name: "email", label: "Email" },
          ],
        })
        .build();

      const block = flow.blocks.userForm;
      const mockOnComplete = jest.fn();
      const mockOnError = jest.fn();

      render(
        <div>
          {block.render!({
            onComplete: mockOnComplete,
            onError: mockOnError,
            context: {},
          })}
        </div>
      );

      const submitButton = screen.getByRole("button", { name: "Continue" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith("Name is required");
      });
    });
  });

  describe("confirm", () => {
    it("should add a confirmation block", () => {
      const builder = new FlowBuilder("test-flow");
      const result = builder.confirm("confirmAction", {
        title: "Confirm Action",
        message: "Are you sure?",
        confirmLabel: "Yes",
        cancelLabel: "No",
      });

      expect(result).toBeDefined();
    });

    it("should render confirmation dialog", () => {
      const builder = new FlowBuilder("test-flow");
      const flow = builder
        .confirm("confirmAction", {
          title: "Confirm Action",
          message: "Are you sure?",
        })
        .build();

      const block = flow.blocks.confirmAction;
      expect(block).toBeDefined();
      expect(block.requiresInteraction).toBe(true);
      expect(block.render).toBeDefined();
    });

    it("should handle confirmation with dynamic message", () => {
      const builder = new FlowBuilder("test-flow");
      const flow = builder
        .confirm("confirmAction", {
          title: "Confirm Action",
          message: (context: any) => `Confirm action for ${context.user?.name}`,
        })
        .build();

      const block = flow.blocks.confirmAction;
      const mockOnComplete = jest.fn();

      render(
        <div>
          {block.render!({
            context: { user: { name: "John" } },
            onComplete: mockOnComplete,
            onError: jest.fn(),
          })}
        </div>
      );

      expect(screen.getByText("Confirm action for John")).toBeInTheDocument();
    });
  });

  describe("display", () => {
    it("should add a display block", () => {
      const builder = new FlowBuilder("test-flow");
      const result = builder.display("showInfo", {
        title: "Information",
        content: "This is some information",
        continueLabel: "Next",
      });

      expect(result).toBeDefined();
    });

    it("should render display content", () => {
      const builder = new FlowBuilder("test-flow");
      const flow = builder
        .display("showInfo", {
          title: "Information",
          content: "This is some information",
        })
        .build();

      const block = flow.blocks.showInfo;
      expect(block).toBeDefined();
      expect(block.requiresInteraction).toBe(true);
      expect(block.render).toBeDefined();
    });
  });

  describe("http", () => {
    it("should add an HTTP block", () => {
      const builder = new FlowBuilder("test-flow");
      const result = builder.http("fetchData", {
        url: "https://api.example.com/data",
        returnType: { id: "string", name: "string" },
        method: "GET",
        headers: { Authorization: "Bearer token" },
      });

      expect(result).toBeDefined();
    });

    it("should execute HTTP request", async () => {
      const mockResponse = { id: "1", name: "Test" };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const builder = new FlowBuilder("test-flow");
      const flow = builder
        .http("fetchData", {
          url: "https://api.example.com/data",
          returnType: { id: "string", name: "string" },
        })
        .build();

      const block = flow.blocks.fetchData;
      const result = await block.run({});

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.objectContaining({
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle HTTP errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const builder = new FlowBuilder("test-flow");
      const flow = builder
        .http("fetchData", {
          url: "https://api.example.com/data",
          returnType: { id: "string", name: "string" },
        })
        .build();

      const block = flow.blocks.fetchData;

      await expect(block.run({})).rejects.toThrow("HTTP 404: Not Found");
    });
  });

  describe("transform", () => {
    it("should add a transformation block", () => {
      const builder = new FlowBuilder("test-flow");
      const result = builder.transform("processData", (input) => ({
        processed: true,
        original: input,
      }));

      expect(result).toBeDefined();
    });

    it("should execute transformation", async () => {
      const builder = new FlowBuilder("test-flow");
      const flow = builder
        .transform("processData", (input: any) => ({
          processed: true,
          original: input,
        }))
        .build();

      const block = flow.blocks.processData;
      const result = await block.run({ test: "data" });

      expect(result).toEqual({
        processed: true,
        original: { test: "data" },
      });
    });
  });

  describe("delay", () => {
    it("should add a delay block", () => {
      const builder = new FlowBuilder("test-flow");
      const result = builder.delay("wait", 1000);

      expect(result).toBeDefined();
    });

    it("should execute delay", async () => {
      const builder = new FlowBuilder("test-flow");
      const flow = builder.delay("wait", 100).build();

      const block = flow.blocks.wait;
      const startTime = Date.now();
      const result = await block.run({ test: "data" });
      const endTime = Date.now();

      expect(result).toEqual({ test: "data" });
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe("log", () => {
    it("should add a logging block", () => {
      const builder = new FlowBuilder("test-flow");
      const result = builder.log("logData", "Processing data");

      expect(result).toBeDefined();
    });

    it("should execute logging", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const builder = new FlowBuilder("test-flow");
      const flow = builder.log("logData", "Processing data").build();

      const block = flow.blocks.logData;
      const result = await block.run({ test: "data" });

      expect(consoleSpy).toHaveBeenCalledWith("Processing data", {
        test: "data",
      });
      expect(result).toEqual({ test: "data" });

      consoleSpy.mockRestore();
    });
  });

  describe("returns", () => {
    it("should set return transformation", () => {
      const builder = new FlowBuilder("test-flow");
      const result = builder.returns((context: any) => ({
        id: context.userForm?.id,
        name: context.userForm?.name,
      }));

      expect(result).toBeDefined();
    });
  });

  describe("build", () => {
    it("should build a complete flow", () => {
      const flow = new FlowBuilder("test-flow")
        .form("userForm", {
          fields: [{ name: "name", label: "Name", required: true }],
        })
        .http("fetchData", {
          url: "https://api.example.com/data",
          returnType: { id: "string" },
        })
        .transform("processData", () => ({ processed: true }))
        .returns(() => ({ result: "success" }))
        .build();

      expect(flow.name).toBe("test-flow");
      expect(flow.blocks).toHaveProperty("userForm");
      expect(flow.blocks).toHaveProperty("fetchData");
      expect(flow.blocks).toHaveProperty("processData");
      expect(flow.blockOrder).toEqual(["userForm", "fetchData", "processData"]);
      expect(flow.returnTransform).toBeDefined();
    });
  });
});

describe("createFlow", () => {
  it("should create a new FlowBuilder", () => {
    const builder = createFlow("test-flow");
    expect(builder).toBeInstanceOf(FlowBuilder);
  });

  it("should create a FlowBuilder with return type", () => {
    const UserSchema = z.object({
      id: z.string(),
      name: z.string(),
    });

    const builder = createFlow<typeof UserSchema>("test-flow");
    expect(builder).toBeInstanceOf(FlowBuilder);
  });
});
