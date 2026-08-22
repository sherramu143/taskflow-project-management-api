export interface OffsetPaginationParams {
  page?: number;
  limit?: number;
}

export interface OffsetPaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginationResult<T> {
  data: T[];
  next_cursor: string | null;
}

export function parseOffsetParams(queryPage?: any, queryLimit?: any): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(queryPage || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(queryLimit || '20'), 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildOffsetResponse<T>(data: T[], total: number, page: number, limit: number): OffsetPaginationResult<T> {
  return {
    data,
    total,
    page,
    limit,
  };
}

export function buildCursorResponse<T extends { id: string }>(
  items: T[],
  limit: number
): CursorPaginationResult<T> {
  let next_cursor: string | null = null;

  if (items.length > limit) {
    const nextItem = items.pop();
    if (nextItem) {
      next_cursor = nextItem.id;
    }
  }

  return {
    data: items,
    next_cursor,
  };
}
