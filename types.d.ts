declare module "@lblod/mu-auth-sudo" {
  export function querySudo(query: string): Promise<{
    results: { ordered: true; distinct: false; bindings: Array<unknown> };
    head: { vars: Array<unknown>; link: [] };
  }>;
}

declare module "mu" {
  import { Express } from "express";
  export const app: Express;
  export function sparqlEscapeUri(uri: string): string;
}
