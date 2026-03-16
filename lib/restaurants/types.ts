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
