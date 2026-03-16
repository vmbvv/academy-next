import "server-only";

import { type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  type RestaurantDetail,
  type RestaurantGradeSummary,
  type RestaurantSummary,
} from "@/lib/restaurants/types";

type RawObjectId = {
  $oid?: string;
};

type RawDate = {
  $date?: string;
};

type RawAddress = {
  building?: unknown;
  coord?: unknown;
  street?: unknown;
  zipcode?: unknown;
};

type RawGrade = {
  date?: RawDate | string | null;
  grade?: unknown;
  score?: unknown;
};

type RawRestaurant = {
  _id?: RawObjectId;
  name?: unknown;
  cuisine?: unknown;
  borough?: unknown;
  restaurant_id?: unknown;
  address?: RawAddress | null;
  grades?: unknown;
};

type RawFacetResult = {
  items?: RawRestaurant[];
  totalCount?: Array<{ count?: number }>;
};

export type ListRestaurantsOptions = {
  page: number;
  pageSize: number;
};

const restaurantFields: Prisma.InputJsonObject = {
  _id: 1,
  name: 1,
  cuisine: 1,
  borough: 1,
  address: 1,
  restaurant_id: 1,
};

function readString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  if (value.trim() === "") {
    return null;
  }

  return value;
}

function readStringOrFallback(value: unknown, fallback: string) {
  const text = readString(value);
  return text ?? fallback;
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function readDate(value: RawDate | string | null | undefined) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && typeof value.$date === "string") {
    return value.$date;
  }

  return null;
}

function formatAddress(address?: RawAddress | null) {
  if (!address) {
    return "Address not available";
  }

  const parts: string[] = [];
  const building = readString(address.building);
  const street = readString(address.street);
  const zipcode = readString(address.zipcode);

  if (building) {
    parts.push(building);
  }

  if (street) {
    parts.push(street);
  }

  if (zipcode) {
    parts.push(zipcode);
  }

  if (parts.length === 0) {
    return "Address not available";
  }

  return parts.join(", ");
}

function readCoordinates(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const first = value[0];
  const second = value[1];

  if (typeof first !== "number" || typeof second !== "number") {
    return null;
  }

  return [first, second];
}

function readGrades(value: unknown): RestaurantGradeSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const grades: RestaurantGradeSummary[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const grade = item as RawGrade;

    grades.push({
      grade: readString(grade.grade),
      score: readNumber(grade.score),
      date: readDate(grade.date),
    });
  }

  grades.sort((a, b) => {
    const firstTime = a.date ? new Date(a.date).getTime() : 0;
    const secondTime = b.date ? new Date(b.date).getTime() : 0;
    return secondTime - firstTime;
  });

  return grades;
}

function makeRestaurantSummary(rawRestaurant: RawRestaurant): RestaurantSummary {
  return {
    id: rawRestaurant._id?.$oid ?? "",
    name: readStringOrFallback(rawRestaurant.name, "Untitled restaurant"),
    cuisine: readStringOrFallback(rawRestaurant.cuisine, "Unknown cuisine"),
    borough: readStringOrFallback(rawRestaurant.borough, "Unknown borough"),
    addressText: formatAddress(rawRestaurant.address),
    restaurantId: readString(rawRestaurant.restaurant_id),
  };
}

function makeRestaurantDetail(rawRestaurant: RawRestaurant): RestaurantDetail {
  const summary = makeRestaurantSummary(rawRestaurant);

  return {
    ...summary,
    coordinates: readCoordinates(rawRestaurant.address?.coord),
    grades: readGrades(rawRestaurant.grades),
  };
}

function readFacetResult(rawValue: unknown) {
  if (!Array.isArray(rawValue)) {
    return { items: [], totalItems: 0 };
  }

  const firstItem = rawValue[0];

  if (!firstItem || typeof firstItem !== "object") {
    return { items: [], totalItems: 0 };
  }

  const facet = firstItem as RawFacetResult;
  const items = Array.isArray(facet.items) ? facet.items : [];

  let totalItems = 0;
  if (
    Array.isArray(facet.totalCount) &&
    facet.totalCount[0] &&
    typeof facet.totalCount[0].count === "number"
  ) {
    totalItems = facet.totalCount[0].count;
  }

  return { items, totalItems };
}

function buildListPipeline(options: ListRestaurantsOptions) {
  const pipeline: Prisma.InputJsonObject[] = [];

  pipeline.push({
    $match: {
      name: { $nin: [null, ""] },
    } as Prisma.InputJsonObject,
  });

  pipeline.push({
    $facet: {
      items: [
        { $sort: { name: 1, _id: 1 } },
        { $skip: (options.page - 1) * options.pageSize },
        { $limit: options.pageSize },
        { $project: restaurantFields },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  return pipeline;
}

export async function listRestaurants(options: ListRestaurantsOptions) {
  const rawList = await prisma.restaurant.aggregateRaw({
    pipeline: buildListPipeline(options),
  });

  const { items, totalItems } = readFacetResult(rawList);
  const restaurants: RestaurantSummary[] = [];

  for (const item of items) {
    const restaurant = makeRestaurantSummary(item);

    if (restaurant.id) {
      restaurants.push(restaurant);
    }
  }

  return {
    restaurants,
    totalItems,
  };
}

export async function getRestaurantById(id: string) {
  const rawResult = await prisma.restaurant.aggregateRaw({
    pipeline: [
      { $match: { _id: { $oid: id } } },
      { $limit: 1 },
      { $project: { ...restaurantFields, grades: 1 } },
    ],
  });

  if (!Array.isArray(rawResult)) {
    return null;
  }

  const firstItem = rawResult[0];

  if (!firstItem || typeof firstItem !== "object") {
    return null;
  }

  return makeRestaurantDetail(firstItem as RawRestaurant);
}
