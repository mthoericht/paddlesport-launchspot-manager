/**
 * Shared type definitions for Point-related data structures
 * These types represent the base location data shared by all point types
 */

/**
 * Base point data structure (location information)
 * This matches the Prisma Point model structure
 */
export interface PointData {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * Category data structure
 */
export interface CategoryData {
  id: number;
  name_en: string;
  name_de: string;
}

/**
 * Public transport station data structure
 */
export interface StationData {
  id: number;
  name: string;
  distanceMeters: number;
}

/**
 * PublicTransportPointType relation data structure
 */
export interface PublicTransportPointTypeRelation {
  type: 'train' | 'tram' | 'sbahn' | 'ubahn';
}

/**
 * PublicTransportPoint with relations
 * Based on Prisma schema: PublicTransportPoint model
 */
export interface PublicTransportPointWithRelations {
  id: number;
  pointId: number;
  lines: string | null;
  createdAt: Date;
  point: PointData;
  types: PublicTransportPointTypeRelation[];
}

/**
 * Prisma Client delegate interface for PublicTransportPoint
 */
export interface PublicTransportPointDelegate {
  findMany: (args: {
    include: {
      point: true;
      types: true;
    };
  }) => Promise<PublicTransportPointWithRelations[]>;
  create: (args: {
    data: {
      pointId: number;
      lines?: string | null;
      types?: {
        create: Array<{
          type: 'train' | 'tram' | 'sbahn' | 'ubahn';
        }>;
      };
    };
    include?: {
      point: true;
      types: true;
    };
  }) => Promise<PublicTransportPointWithRelations>;
  deleteMany: (args: {
    where: {
      id?: { in: number[] };
      pointId?: { in: number[] };
    };
  }) => Promise<{ count: number }>;
}

/**
 * LaunchPoint with relations
 * Based on Prisma schema: LaunchPoint model
 */
export interface LaunchPointWithRelations {
  id: number;
  pointId: number;
  isOfficial: boolean;
  hints: string | null;
  openingHours: string;
  parkingOptions: string | null;
  nearbyWaters: string | null;
  foodSupply: string | null;
  createdAt: Date;
  createdById: number;
  point: PointData;
  createdBy: {
    username: string;
  };
  categories: Array<{
    category: CategoryData;
    categoryId: number;
  }>;
  stations: StationData[];
}

/**
 * LaunchPoint create data structure
 */
export interface LaunchPointCreateData {
  point: {
    create: {
      name: string;
      latitude: number;
      longitude: number;
    };
  };
  hints: string | null;
  openingHours: string;
  parkingOptions: string | null;
  nearbyWaters: string | null;
  foodSupply: string | null;
  createdBy: {
    connect: { id: number };
  };
  categories: {
    create: Array<{ categoryId: number }>;
  };
  stations: {
    create: Array<{ name: string; distanceMeters: number }>;
  };
}

/**
 * LaunchPoint update data structure
 */
export interface LaunchPointUpdateData {
  hints?: string | null;
  openingHours?: string;
  parkingOptions?: string | null;
  nearbyWaters?: string | null;
  foodSupply?: string | null;
}

/**
 * Prisma Client delegate interface for LaunchPoint
 */
export interface LaunchPointDelegate {
  findMany: (args: {
    where?: import('@prisma/client').Prisma.LaunchPointWhereInput;
    include: {
      point: true;
      createdBy: {
        select: { username: true };
      };
      categories: {
        include: {
          category: {
            select: { id: true; name_en: true; name_de: true };
          };
        };
      };
      stations: {
        select: { id: true; name: true; distanceMeters: true };
      };
    };
    orderBy?: { createdAt: 'desc' | 'asc' };
  }) => Promise<LaunchPointWithRelations[]>;
  findUnique: (args: {
    where: { id: number };
    include: {
      point: true;
      createdBy?: {
        select: { username: true };
      };
      categories?: {
        include: {
          category: {
            select: { id: true; name_en: true; name_de: true };
          };
        };
      };
      stations?: {
        select: { id: true; name: true; distanceMeters: true };
      };
    };
  }) => Promise<LaunchPointWithRelations | null>;
  create: (args: {
    data: LaunchPointCreateData;
  }) => Promise<LaunchPointWithRelations>;
  update: (args: {
    where: { id: number };
    data: LaunchPointUpdateData;
  }) => Promise<LaunchPointWithRelations>;
  delete: (args: {
    where: { id: number };
  }) => Promise<LaunchPointWithRelations>;
}

/**
 * Prisma Client delegate interface for Point
 */
export interface PointDelegate {
  create: (args: {
    data: {
      name: string;
      latitude: number;
      longitude: number;
    };
  }) => Promise<PointData>;
  update: (args: {
    where: { id: number };
    data: {
      name: string;
      latitude: number;
      longitude: number;
    };
  }) => Promise<PointData>;
  delete: (args: {
    where: { id: number };
  }) => Promise<PointData>;
  deleteMany: (args: {
    where: {
      id?: { in: number[] };
    };
  }) => Promise<{ count: number }>;
}

/**
 * Prisma Client delegate interface for PublicTransportPointType
 */
export interface PublicTransportPointTypeDelegate {
  deleteMany: (args: {
    where: {
      publicTransportPointId?: { in: number[] };
      id?: { in: number[] };
    };
  }) => Promise<{ count: number }>;
}

/**
 * Extended Prisma Client interface that includes publicTransportPoint, launchPoint, point, and publicTransportPointType
 * Intersects the base PrismaClient with the delegates
 */
export type TypedPrismaClient = import('@prisma/client').PrismaClient & {
  publicTransportPoint: PublicTransportPointDelegate;
  launchPoint: LaunchPointDelegate;
  point: PointDelegate;
  publicTransportPointType: PublicTransportPointTypeDelegate;
};
