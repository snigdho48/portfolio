import { Helmet } from "react-helmet-async";
import { siteConfig, siteUrl } from "@/data/portfolio";

type SeoProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
};

export default function Seo({
  title,
  description,
  path = "/",
  image = siteConfig.ogImage,
  type = "website",
}: SeoProps) {
  const pageTitle = title
    ? `${title} | ${siteConfig.shortName}`
    : `${siteConfig.name} | ${siteConfig.title}`;
  const desc = description ?? siteConfig.bio;
  const url = `${siteUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const imageUrl = image.startsWith("http")
    ? image
    : `${siteUrl.replace(/\/$/, "")}${image}`;

  return (
    <Helmet>
      <html lang="en" />
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      <meta name="author" content={siteConfig.name} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteConfig.name} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
