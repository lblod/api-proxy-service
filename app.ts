import { app, sparqlEscapeUri } from "mu";
import bodyParser from "body-parser";
import { querySudo as query } from "@lblod/mu-auth-sudo";

import { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { cleanEnv, EnvError, makeValidator, str, url } from "envalid";

const requiredRolesValidator = makeValidator((x) => {
  try {
    const trimmed = x.trim();

    // Splitting empty string will result in [""], an array with one empty string
    // So have to check for empty string here first
    if (!trimmed) {
      return [];
    }

    return trimmed.split(",");
  } catch (e) {
    throw new EnvError(`Invalid roles input: "${x}"`);
  }
});

const env = cleanEnv(process.env, {
  API_KEY: str(),
  API_URL: url(),
  API_KEY_HEADER: str({ default: "x-api-key" }),
  REQUIRED_ROLES: requiredRolesValidator({ default: [] }),
  ALLOWED_ORIGIN: str({ default: "" }),
});

app.use(bodyParser.json({ limit: "50mb" }));

const isSessionAuthorized = async (
  sessionId: string,
  requiredRoles: string[],
) => {
  // If no roles are required, we can skip the query
  if (requiredRoles.length === 0) return true;

  const filterRolesString = requiredRoles.map((role) => `"${role}"`).join(",");

  const muQuery = `PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
                  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
                  SELECT DISTINCT ?session_group WHERE {
                    ${sparqlEscapeUri(sessionId)} ext:sessionGroup/mu:uuid ?session_group;
                                 ext:sessionRole ?role.
                     FILTER(?role in (${filterRolesString}))
                    }`;

  const result = await query(muQuery);

  return result.results.bindings.length > 0;
};

app.use(
  "/*",
  createProxyMiddleware<Request, Response>({
    target: env.API_URL,
    changeOrigin: true,
    headers: {
      [env.API_KEY_HEADER]: env.API_KEY,
    },
    pathRewrite: (_path, req) =>
      req.originalUrl ?? `${req.baseUrl || ""}${req.url}`,
    plugins: [
      (proxyServer) => {
        proxyServer.on("proxyReq", async (_error, req, res: Response) => {
          const muSessionId = req.headers["mu-session-id"];
          const requiredRoles = env.REQUIRED_ROLES;

          // We only check the session if there are required roles
          if (requiredRoles.length > 0) {
            if (!muSessionId || typeof muSessionId !== "string") {
              return res.status(401).send();
            }

            if (!(await isSessionAuthorized(muSessionId, requiredRoles))) {
              return res.status(403).send();
            }
          }
          if (env.ALLOWED_ORIGIN) {
            res.setHeader("access-control-allow-origin", env.ALLOWED_ORIGIN);
          }
        });
      },
    ],
  }),
);
