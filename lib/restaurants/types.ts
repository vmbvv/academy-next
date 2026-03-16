export type RestaurantSummary = {
  id: string;
  name: string;
  cuisine: string;
  borough: string;
  addressText: string;
  restaurantId: string | null;
};

export type RestaurantGradeSummary = {
  grade: string | null;
  score: number | null;
  date: string | null;
};

export type RestaurantDetail = RestaurantSummary & {
  coordinates: [number, number] | null;
  grades: RestaurantGradeSummary[];
};

export type RestaurantListFilters = {
  search: string;
  cuisine: string;
  borough: string;
};

export type RestaurantListResult = {
  restaurants: RestaurantSummary[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  filters: RestaurantListFilters;
};
