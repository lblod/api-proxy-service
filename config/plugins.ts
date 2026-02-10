import type { Plugin } from "http-proxy-middleware";
import { Request, Response } from "express";

const plugins: Plugin<Request, Response>[] = [];

export default plugins;
