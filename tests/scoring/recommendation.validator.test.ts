import { weightsQuerySchema } from "../../src/validators/recommendation.validator";

test("uses default weights when no overrides are provided", () => {
    expect(weightsQuerySchema.parse({})).toEqual({});
});

test("requires all custom weights and a total of 100", () => {
    expect(() => weightsQuerySchema.parse({ skills: "50", experience: "50" })).toThrow();
    expect(() => weightsQuerySchema.parse({
        skills: "50",
        experience: "20",
        location: "15",
        salary: "15",
    })).not.toThrow();
});