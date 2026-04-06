export type BusinessSection =
  | ""
  | "/chats"
  | "/products"
  | "/business"
  | "/rag"
  | "/integrations"
  | "/order-confirmations";

export function getBusinessHref(
  businessId: number | string,
  section: BusinessSection = "",
) {
  return `/b/${businessId}${section}`;
}

export function mapDashboardHrefToBusiness(
  href: string,
  businessId: number,
) {
  if (!href.startsWith("/dashboard")) {
    return href;
  }

  const suffix = href.replace(/^\/dashboard/, "");
  return getBusinessHref(businessId, (suffix || "") as BusinessSection);
}
