import type { NextConfig } from "next";

import * as dotenv from "dotenv";
const configuration = dotenv.config({ path: "../.env.local"});

const nextConfig: NextConfig = {
  env:configuration.parsed,
};

export default nextConfig;
