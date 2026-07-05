// otp.ts использует node:crypto — экспортируется отдельным entrypoint
// "@rentlegal/core/otp" и не должен попадать в клиентский бандл.
export * from "./phone";
export * from "./property";
export * from "./schedule";
export * from "./verification";
export * from "./cities";
export * from "./api-types";
