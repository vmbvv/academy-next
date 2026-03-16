import "server-only";

import { type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  type RestaurantDetail,
  type RestaurantGradeSummary,
  type RestaurantListFilters,
  type RestaurantListResult,
  type RestaurantSummary,
} from "@/lib/restaurants/types";

export const DEFAULT_RESTAURANT_PAGE_SIZE = 12;

export type ListRestaurantsOptions = {
  page: number;
  pageSize: number;
  search?: string;
  cuisine?: string;
  borough?: string;
};

type RestaurantAddressRecord = {
  building: string;
  coord: number[];
  street: string;
  zipcode: string;
};

type RestaurantGradeRecord = {
  date: Date;
  grade: string;
  score: number | null;
};

type RestaurantSummaryRecord = {
  id: string;
  name: string;
  cuisine: string;
  borough: string;
  restaurantId: string;
  address: RestaurantAddressRecord;
};

type RestaurantDetailRecord = RestaurantSummaryRecord & {
  grades: RestaurantGradeRecord[];
};

function readPageNumber(value: number, fallback: number) {
  if (!Number.isInteger(value) || value < 1) {
    return fallback;
  }

  return value;
}

function readText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return null;
  }

  return trimmedValue;
}

function readTextOrFallback(value: string | null | undefined, fallback: string) {
  return readText(value) ?? fallback;
}

function readFilterValue(value: string | null | undefined) {
  return readText(value) ?? "";
}

function readFilters(options: ListRestaurantsOptions): RestaurantListFilters {
  return {
    search: readFilterValue(options.search),
    cuisine: readFilterValue(options.cuisine),
    borough: readFilterValue(options.borough),
  };
}

function buildRestaurantWhere(
  filters: RestaurantListFilters,
): Prisma.RestaurantWhereInput {
  const where: Prisma.RestaurantWhereInput = {
    name: {
      not: "",
    },
  };

  if (filters.search) {
    where.name = {
      not: "",
      contains: filters.search,
      mode: "insensitive",
    };
  }

  if (filters.cuisine) {
    where.cuisine = {
      contains: filters.cuisine,
      mode: "insensitive",
    };
  }

  if (filters.borough) {
    where.borough = {
      contains: filters.borough,
      mode: "insensitive",
    };
  }

  return where;
}

function formatAddress(address: RestaurantAddressRecord) {
  const parts = [
    readText(address.building),
    readText(address.street),
    readText(address.zipcode),
  ].filter(Boolean);

  if (parts.length === 0) {
    return "Address not available";
  }

  return parts.join(", ");
}

function readCoordinates(address: RestaurantAddressRecord): [number, number] | null {
  if (address.coord.length < 2) {
    return null;
  }

  const longitude = address.coord[0];
  const latitude = address.coord[1];

  if (typeof longitude !== "number" || typeof latitude !== "number") {
    return null;
  }

  return [longitude, latitude];
}

function mapGrades(grades: RestaurantGradeRecord[]): RestaurantGradeSummary[] {
  const sortedGrades = [...grades];

  sortedGrades.sort((firstGrade, secondGrade) => {
    const firstTime = firstGrade.date ? firstGrade.date.getTime() : 0;
    const secondTime = secondGrade.date ? secondGrade.date.getTime() : 0;

    return secondTime - firstTime;
  });

  return sortedGrades.map((grade) => {
    return {
      grade: readText(grade.grade),
      score: grade.score ?? null,
      date: grade.date ? grade.date.toISOString() : null,
    };
  });
}

function mapRestaurantSummary(
  restaurant: RestaurantSummaryRecord,
): RestaurantSummary {
  return {
    id: restaurant.id,
    name: readTextOrFallback(restaurant.name, "Untitled restaurant"),
    cuisine: readTextOrFallback(restaurant.cuisine, "Unknown cuisine"),
    borough: readTextOrFallback(restaurant.borough, "Unknown borough"),
    addressText: formatAddress(restaurant.address),
    restaurantId: readText(restaurant.restaurantId),
  };
}

function mapRestaurantDetail(restaurant: RestaurantDetailRecord): RestaurantDetail {
  return {
    ...mapRestaurantSummary(restaurant),
    coordinates: readCoordinates(restaurant.address),
    grades: mapGrades(restaurant.grades),
  };
}

export async function listRestaurants(
  options: ListRestaurantsOptions,
): Promise<RestaurantListResult> {
  const pageSize = readPageNumber(
    options.pageSize,
    DEFAULT_RESTAURANT_PAGE_SIZE,
  );
  const requestedPage = readPageNumber(options.page, 1);
  const filters = readFilters(options);
  const where = buildRestaurantWhere(filters);

  // console.log(requestedPage);
  // console.log(pageSize);
  // console.log(filters);

  const totalItems = await prisma.restaurant.count({
    where,
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const restaurantsFromDb = await prisma.restaurant.findMany({
    where,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      name: true,
      cuisine: true,
      borough: true,
      restaurantId: true,
      address: true,
    },
  });

  // console.log(restaurantsFromDb[0]);

  return {
    restaurants: restaurantsFromDb.map(mapRestaurantSummary),
    page,
    pageSize,
    totalItems,
    totalPages,
    filters,
  };
}

export async function getRestaurantById(id: string) {
  // console.log(id);

  const restaurantFromDb = await prisma.restaurant.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      cuisine: true,
      borough: true,
      restaurantId: true,
      address: true,
      grades: true,
    },
  });

  // console.log(restaurantFromDb);

  if (!restaurantFromDb) {
    return null;
  }

  return mapRestaurantDetail(restaurantFromDb);
}
