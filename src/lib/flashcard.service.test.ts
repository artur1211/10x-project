import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlashcardService } from "./flashcard.service";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardEntity } from "@/types";
import { NotFoundError, ForbiddenError } from "./flashcard.errors";

describe("FlashcardService", () => {
  let service: FlashcardService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  const testUserId = "test-user-id";
  const testFlashcardId = "test-flashcard-id";

  // Helper to create a test flashcard entity
  const createTestFlashcard = (overrides: Partial<FlashcardEntity> = {}): FlashcardEntity => ({
    id: testFlashcardId,
    user_id: testUserId,
    front_text: "Test Question",
    back_text: "Test Answer",
    generation_batch_id: null,
    is_ai_generated: false,
    was_edited: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  });

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new FlashcardService(mockSupabase as SupabaseClient);
  });

  describe("constructor", () => {
    it("should initialize with supabase client", () => {
      expect(service).toBeInstanceOf(FlashcardService);
    });
  });

  describe("getUserFlashcardCount", () => {
    it("should return the count of user flashcards", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: 42,
            error: null,
          }),
        }),
      });
      mockSupabase.from = mockFrom;

      const count = await service.getUserFlashcardCount(testUserId);

      expect(count).toBe(42);
      expect(mockFrom).toHaveBeenCalledWith("flashcards");
    });

    it("should return 0 when count is null", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: null,
            error: null,
          }),
        }),
      });
      mockSupabase.from = mockFrom;

      const count = await service.getUserFlashcardCount(testUserId);

      expect(count).toBe(0);
    });

    it("should throw error when database query fails", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: null,
            error: { message: "Database error" },
          }),
        }),
      });
      mockSupabase.from = mockFrom;

      await expect(service.getUserFlashcardCount(testUserId)).rejects.toThrow(
        "Failed to count user flashcards: Database error"
      );
    });
  });

  describe("getUserFlashcardStats", () => {
    it("should return correct stats when user has flashcards", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: 100,
            error: null,
          }),
        }),
      });
      mockSupabase.from = mockFrom;

      const stats = await service.getUserFlashcardStats(testUserId);

      expect(stats).toEqual({
        total_flashcards: 100,
        flashcard_limit: 500,
        remaining_capacity: 400,
      });
    });

    it("should return correct stats when user is at limit", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: 500,
            error: null,
          }),
        }),
      });
      mockSupabase.from = mockFrom;

      const stats = await service.getUserFlashcardStats(testUserId);

      expect(stats).toEqual({
        total_flashcards: 500,
        flashcard_limit: 500,
        remaining_capacity: 0,
      });
    });
  });

  describe("createFlashcard", () => {
    it("should successfully create a flashcard", async () => {
      const testFlashcard = createTestFlashcard();
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: testFlashcard,
          error: null,
        }),
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      const mockFrom = vi.fn((table: string) => {
        if (table === "flashcards") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 10,
                error: null,
              }),
            }),
            insert: mockInsert,
          };
        }
        return {};
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from = mockFrom as any;

      const result = await service.createFlashcard(testUserId, "Test Question", "Test Answer");

      expect(result).toEqual({
        id: testFlashcardId,
        front_text: "Test Question",
        back_text: "Test Answer",
        generation_batch_id: null,
        is_ai_generated: false,
        was_edited: false,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: testUserId,
        front_text: "Test Question",
        back_text: "Test Answer",
        is_ai_generated: false,
        was_edited: false,
        generation_batch_id: null,
      });
    });

    it("should throw ForbiddenError when user is at limit", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: 500,
            error: null,
          }),
        }),
      });
      mockSupabase.from = mockFrom;

      try {
        await service.createFlashcard(testUserId, "Test Question", "Test Answer");
        expect.fail("Should have thrown ForbiddenError");
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect((error as ForbiddenError).currentCount).toBe(500);
        expect((error as ForbiddenError).limit).toBe(500);
      }
    });

    it("should throw error when database insert fails", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert failed" },
        }),
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      const mockFrom = vi.fn((table: string) => {
        if (table === "flashcards") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 10,
                error: null,
              }),
            }),
            insert: mockInsert,
          };
        }
        return {};
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from = mockFrom as any;

      await expect(service.createFlashcard(testUserId, "Test Question", "Test Answer")).rejects.toThrow(
        "Failed to create flashcard: Insert failed"
      );
    });
  });

  describe("getFlashcards", () => {
    it("should return paginated flashcards with correct query options", async () => {
      const testFlashcards = [createTestFlashcard({ id: "card-1" }), createTestFlashcard({ id: "card-2" })];

      const mockRange = vi.fn().mockResolvedValue({
        data: testFlashcards,
        error: null,
        count: 25,
      });
      const mockOrder = vi.fn().mockReturnValue({
        range: mockRange,
      });
      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      mockSupabase.from = mockFrom;

      const result = await service.getFlashcards(testUserId, {
        page: 2,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
      });

      expect(result.flashcards).toHaveLength(2);
      expect(result.totalCount).toBe(25);
      expect(mockFrom).toHaveBeenCalledWith("flashcards");
      expect(mockSelect).toHaveBeenCalledWith("*", { count: "exact" });
      expect(mockEq).toHaveBeenCalledWith("user_id", testUserId);
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockRange).toHaveBeenCalledWith(10, 19); // page 2, limit 10
    });

    it("should apply search filter when provided", async () => {
      const mockRange = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      const mockOrder = vi.fn().mockReturnValue({
        range: mockRange,
      });
      const mockOr = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockEq = vi.fn().mockReturnValue({
        or: mockOr,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      mockSupabase.from = mockFrom;

      await service.getFlashcards(testUserId, {
        page: 1,
        limit: 20,
        search: "test query",
        sortBy: "updated_at",
        sortOrder: "asc",
      });

      expect(mockOr).toHaveBeenCalledWith("front_text.ilike.%test query%,back_text.ilike.%test query%");
    });

    it("should handle empty results", async () => {
      const mockRange = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      const mockOrder = vi.fn().mockReturnValue({
        range: mockRange,
      });
      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      mockSupabase.from = mockFrom;

      const result = await service.getFlashcards(testUserId, {
        page: 1,
        limit: 20,
        sortBy: "created_at",
        sortOrder: "desc",
      });

      expect(result.flashcards).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should throw error when database query fails", async () => {
      const mockRange = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
        count: null,
      });
      const mockOrder = vi.fn().mockReturnValue({
        range: mockRange,
      });
      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      mockSupabase.from = mockFrom;

      await expect(
        service.getFlashcards(testUserId, {
          page: 1,
          limit: 20,
          sortBy: "created_at",
          sortOrder: "desc",
        })
      ).rejects.toThrow("Failed to fetch flashcards: Query failed");
    });
  });

  describe("getFlashcardById", () => {
    it("should return a flashcard when found", async () => {
      const testFlashcard = createTestFlashcard();
      const mockSingle = vi.fn().mockResolvedValue({
        data: testFlashcard,
        error: null,
      });
      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      mockSupabase.from = mockFrom;

      const result = await service.getFlashcardById(testUserId, testFlashcardId);

      expect(result.id).toBe(testFlashcardId);
      expect(result.front_text).toBe("Test Question");
      expect(mockEq1).toHaveBeenCalledWith("id", testFlashcardId);
      expect(mockEq2).toHaveBeenCalledWith("user_id", testUserId);
    });

    it("should throw NotFoundError when flashcard not found", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });
      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      mockSupabase.from = mockFrom;

      try {
        await service.getFlashcardById(testUserId, testFlashcardId);
        expect.fail("Should have thrown NotFoundError");
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should throw NotFoundError when flashcard belongs to different user", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      mockSupabase.from = mockFrom;

      await expect(service.getFlashcardById(testUserId, testFlashcardId)).rejects.toThrow(
        "Flashcard not found or does not belong to user"
      );
    });
  });

  describe("updateFlashcard", () => {
    it("should successfully update a flashcard with both fields", async () => {
      const originalFlashcard = createTestFlashcard();
      const updatedFlashcard = createTestFlashcard({
        front_text: "Updated Question",
        back_text: "Updated Answer",
        was_edited: true,
      });

      // Mock for getFlashcardById (verification)
      const mockGetSingle = vi.fn().mockResolvedValue({
        data: originalFlashcard,
        error: null,
      });

      // Mock for update operation
      const mockUpdateSingle = vi.fn().mockResolvedValue({
        data: updatedFlashcard,
        error: null,
      });
      const mockUpdateSelect = vi.fn().mockReturnValue({
        single: mockUpdateSingle,
      });
      const mockUpdateEq2 = vi.fn().mockReturnValue({
        select: mockUpdateSelect,
      });
      const mockUpdateEq1 = vi.fn().mockReturnValue({
        eq: mockUpdateEq2,
      });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockUpdateEq1,
      });

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call for getFlashcardById
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockGetSingle,
                }),
              }),
            }),
          };
        } else {
          // Second call for update
          return {
            update: mockUpdate,
          };
        }
      });
      mockSupabase.from = mockFrom;

      const result = await service.updateFlashcard(testUserId, testFlashcardId, {
        frontText: "Updated Question",
        backText: "Updated Answer",
      });

      expect(result.front_text).toBe("Updated Question");
      expect(result.back_text).toBe("Updated Answer");
      expect(result.was_edited).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        was_edited: true,
        front_text: "Updated Question",
        back_text: "Updated Answer",
      });
    });

    it("should update only front_text when back_text is not provided", async () => {
      const originalFlashcard = createTestFlashcard();
      const updatedFlashcard = createTestFlashcard({
        front_text: "Updated Question",
        was_edited: true,
      });

      const mockGetSingle = vi.fn().mockResolvedValue({
        data: originalFlashcard,
        error: null,
      });

      const mockUpdateSingle = vi.fn().mockResolvedValue({
        data: updatedFlashcard,
        error: null,
      });
      const mockUpdateSelect = vi.fn().mockReturnValue({
        single: mockUpdateSingle,
      });
      const mockUpdateEq2 = vi.fn().mockReturnValue({
        select: mockUpdateSelect,
      });
      const mockUpdateEq1 = vi.fn().mockReturnValue({
        eq: mockUpdateEq2,
      });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockUpdateEq1,
      });

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockGetSingle,
                }),
              }),
            }),
          };
        } else {
          return {
            update: mockUpdate,
          };
        }
      });
      mockSupabase.from = mockFrom;

      await service.updateFlashcard(testUserId, testFlashcardId, {
        frontText: "Updated Question",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        was_edited: true,
        front_text: "Updated Question",
      });
    });

    it("should throw NotFoundError when flashcard does not exist", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });
      mockSupabase.from = mockFrom;

      try {
        await service.updateFlashcard(testUserId, testFlashcardId, {
          frontText: "Updated Question",
        });
        expect.fail("Should have thrown NotFoundError");
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe("deleteFlashcard", () => {
    it("should successfully delete a flashcard", async () => {
      const testFlashcard = createTestFlashcard();

      // Mock for getFlashcardById
      const mockGetSingle = vi.fn().mockResolvedValue({
        data: testFlashcard,
        error: null,
      });

      // Mock for delete operation
      const mockDeleteEq2 = vi.fn().mockResolvedValue({
        error: null,
      });
      const mockDeleteEq1 = vi.fn().mockReturnValue({
        eq: mockDeleteEq2,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockDeleteEq1,
      });

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call for getFlashcardById
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockGetSingle,
                }),
              }),
            }),
          };
        } else {
          // Second call for delete
          return {
            delete: mockDelete,
          };
        }
      });
      mockSupabase.from = mockFrom;

      const result = await service.deleteFlashcard(testUserId, testFlashcardId);

      expect(result).toBe(testFlashcardId);
      expect(mockDeleteEq1).toHaveBeenCalledWith("id", testFlashcardId);
      expect(mockDeleteEq2).toHaveBeenCalledWith("user_id", testUserId);
    });

    it("should throw NotFoundError when flashcard does not exist", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });
      mockSupabase.from = mockFrom;

      try {
        await service.deleteFlashcard(testUserId, testFlashcardId);
        expect.fail("Should have thrown NotFoundError");
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should throw error when delete operation fails", async () => {
      const testFlashcard = createTestFlashcard();

      const mockGetSingle = vi.fn().mockResolvedValue({
        data: testFlashcard,
        error: null,
      });

      const mockDeleteEq2 = vi.fn().mockResolvedValue({
        error: { message: "Delete failed" },
      });
      const mockDeleteEq1 = vi.fn().mockReturnValue({
        eq: mockDeleteEq2,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockDeleteEq1,
      });

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockGetSingle,
                }),
              }),
            }),
          };
        } else {
          return {
            delete: mockDelete,
          };
        }
      });
      mockSupabase.from = mockFrom;

      await expect(service.deleteFlashcard(testUserId, testFlashcardId)).rejects.toThrow(
        "Failed to delete flashcard: Delete failed"
      );
    });
  });

  describe("deleteFlashcards", () => {
    it("should successfully delete multiple flashcards", async () => {
      const flashcardIds = ["id-1", "id-2", "id-3"];
      const existingFlashcards = [{ id: "id-1" }, { id: "id-2" }, { id: "id-3" }];

      // Mock for fetching existing flashcards
      const mockSelectIn = vi.fn().mockResolvedValue({
        data: existingFlashcards,
        error: null,
      });
      const mockSelectEq = vi.fn().mockReturnValue({
        in: mockSelectIn,
      });

      // Mock for delete operation
      const mockDeleteIn = vi.fn().mockResolvedValue({
        error: null,
      });
      const mockDeleteEq = vi.fn().mockReturnValue({
        in: mockDeleteIn,
      });

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call for fetching existing flashcards
          return {
            select: vi.fn().mockReturnValue({
              eq: mockSelectEq,
            }),
          };
        } else {
          // Second call for delete
          return {
            delete: vi.fn().mockReturnValue({
              eq: mockDeleteEq,
            }),
          };
        }
      });
      mockSupabase.from = mockFrom;

      const result = await service.deleteFlashcards(testUserId, flashcardIds);

      expect(result.deletedCount).toBe(3);
      expect(result.deletedIds).toEqual(["id-1", "id-2", "id-3"]);
      expect(mockDeleteEq).toHaveBeenCalledWith("user_id", testUserId);
      expect(mockDeleteIn).toHaveBeenCalledWith("id", ["id-1", "id-2", "id-3"]);
    });

    it("should only delete flashcards that belong to the user", async () => {
      const flashcardIds = ["id-1", "id-2", "id-3"];
      const existingFlashcards = [{ id: "id-1" }, { id: "id-3" }]; // id-2 doesn't belong to user

      const mockSelectIn = vi.fn().mockResolvedValue({
        data: existingFlashcards,
        error: null,
      });
      const mockSelectEq = vi.fn().mockReturnValue({
        in: mockSelectIn,
      });

      const mockDeleteIn = vi.fn().mockResolvedValue({
        error: null,
      });
      const mockDeleteEq = vi.fn().mockReturnValue({
        in: mockDeleteIn,
      });

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: mockSelectEq,
            }),
          };
        } else {
          return {
            delete: vi.fn().mockReturnValue({
              eq: mockDeleteEq,
            }),
          };
        }
      });
      mockSupabase.from = mockFrom;

      const result = await service.deleteFlashcards(testUserId, flashcardIds);

      expect(result.deletedCount).toBe(2);
      expect(result.deletedIds).toEqual(["id-1", "id-3"]);
    });

    it("should return empty result when no valid IDs found", async () => {
      const flashcardIds = ["id-1", "id-2"];
      const existingFlashcards: { id: string }[] = [];

      const mockSelectIn = vi.fn().mockResolvedValue({
        data: existingFlashcards,
        error: null,
      });
      const mockSelectEq = vi.fn().mockReturnValue({
        in: mockSelectIn,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockSelectEq,
        }),
      });
      mockSupabase.from = mockFrom;

      const result = await service.deleteFlashcards(testUserId, flashcardIds);

      expect(result.deletedCount).toBe(0);
      expect(result.deletedIds).toEqual([]);
    });

    it("should throw error when verification query fails", async () => {
      const flashcardIds = ["id-1", "id-2"];

      const mockSelectIn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });
      const mockSelectEq = vi.fn().mockReturnValue({
        in: mockSelectIn,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockSelectEq,
        }),
      });
      mockSupabase.from = mockFrom;

      await expect(service.deleteFlashcards(testUserId, flashcardIds)).rejects.toThrow(
        "Failed to verify flashcards: Query failed"
      );
    });

    it("should throw error when delete operation fails", async () => {
      const flashcardIds = ["id-1"];
      const existingFlashcards = [{ id: "id-1" }];

      const mockSelectIn = vi.fn().mockResolvedValue({
        data: existingFlashcards,
        error: null,
      });
      const mockSelectEq = vi.fn().mockReturnValue({
        in: mockSelectIn,
      });

      const mockDeleteIn = vi.fn().mockResolvedValue({
        error: { message: "Delete failed" },
      });
      const mockDeleteEq = vi.fn().mockReturnValue({
        in: mockDeleteIn,
      });

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: mockSelectEq,
            }),
          };
        } else {
          return {
            delete: vi.fn().mockReturnValue({
              eq: mockDeleteEq,
            }),
          };
        }
      });
      mockSupabase.from = mockFrom;

      await expect(service.deleteFlashcards(testUserId, flashcardIds)).rejects.toThrow(
        "Failed to delete flashcards: Delete failed"
      );
    });
  });
});
