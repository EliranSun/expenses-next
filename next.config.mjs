/** @type {import('next').NextConfig} */
const nextConfig = {
    // pdfjs-dist runs in Node inside the parsePdfToTsv server action. Keep it external
    // so Next loads it from node_modules at runtime instead of bundling it.
    serverExternalPackages: ['pdfjs-dist'],
};

export default nextConfig;
