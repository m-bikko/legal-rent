"use client";

import { Alert, Button, Empty, Skeleton, Tooltip, Typography } from "antd";
import { ImageOff, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useMyProperties } from "@/lib/queries";
import { useUser } from "@/components/shell/user-context";
import { StatusBadge } from "@/components/property/status-badge";
import { formatPrice } from "@/lib/format";

const MyPropertiesPage = () => {
  const t = useTranslations("myProperties");
  const tProfile = useTranslations("profile");
  const tProp = useTranslations("property");
  const user = useUser();
  const { data: items, isLoading } = useMyProperties();

  const verified = user.verificationStatus === "approved";

  const addButton = verified ? (
    <Link href="/my-properties/new">
      <Button type="primary" icon={<Plus size={16} />}>
        {t("add")}
      </Button>
    </Link>
  ) : (
    <Tooltip title={t("needVerification")}>
      <Button type="primary" icon={<Plus size={16} />} disabled>
        {t("add")}
      </Button>
    </Tooltip>
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Typography.Title level={4} className="!mb-0 md:!text-2xl">
          {t("title")}
        </Typography.Title>
        {addButton}
      </div>

      {!verified && (
        <Alert
          type="warning"
          showIcon
          message={tProfile("verificationRequired")}
          action={
            <Link href="/profile/verification">
              <Button size="small" type="primary">
                {tProfile("verificationCta")}
              </Button>
            </Link>
          }
        />
      )}

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !items || items.length === 0 ? (
        <Empty
          className="mt-16"
          description={
            <div>
              <div>{t("empty")}</div>
              <div className="text-sm text-gray-400">{t("emptyHint")}</div>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/my-properties/${p.id}`}
              className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md"
            >
              {p.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photos[0]}
                  alt={p.address}
                  className="h-20 w-24 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <ImageOff size={22} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Typography.Text strong>
                    {formatPrice(p.price)}
                    <span className="text-sm font-normal text-gray-500">
                      /{tProp(`rentPeriod.${p.rentPeriod}` as "rentPeriod.month")}
                    </span>
                  </Typography.Text>
                  <StatusBadge status={p.status} />
                </div>
                <Typography.Text type="secondary" className="block truncate text-sm">
                  {tProp(`types.${p.type}` as "types.apartment")} · {p.address}
                </Typography.Text>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPropertiesPage;
