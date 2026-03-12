export const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export function isMongoObjectId(value: string) {
  return OBJECT_ID_REGEX.test(value);
}
