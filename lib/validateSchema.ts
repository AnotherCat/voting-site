import Ajv from "ajv/dist/jtd";

let ajv: Ajv | null = null;

export default function validateSchema(schema: any, body: any): boolean {
  if (!ajv) {
    ajv = new Ajv({ allErrors: true, removeAdditional: "all" });
  } // TODO Doens't seem to work
  return ajv.validate(schema, body);
}
