"use client";

import { useState } from "react";
import { Button, Form, Input, InputNumber, Segmented, Select, Upload, App } from "antd";
import type { UploadFile } from "antd";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PropertyType, RentPeriod, type CreatePropertyBody } from "@rentlegal/core";
import type { PropertyRow } from "@/lib/types";
import { useApiErrorMessage } from "@/lib/use-api-error";
import { PhoneInput } from "@/components/phone-input";
import { CitySelect } from "@/components/city-select";

export type PropertyFormValues = Omit<CreatePropertyBody, "price"> & { price: number };

type Props = {
  initial?: PropertyRow;
  submitLabel: string;
  onSubmit: (values: PropertyFormValues, photos: File[]) => Promise<void>;
};

export const PropertyForm = ({ initial, submitLabel, onSubmit }: Props) => {
  const t = useTranslations("myProperties");
  const tProp = useTranslations("property");
  const errorMessage = useApiErrorMessage();
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async (values: PropertyFormValues) => {
    setLoading(true);
    try {
      const files = fileList
        .map((f) => f.originFileObj)
        .filter((f): f is NonNullable<typeof f> => Boolean(f));
      await onSubmit(values, files);
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<PropertyFormValues>
      layout="vertical"
      requiredMark={false}
      onFinish={(v) => void submit(v)}
      initialValues={
        initial
          ? {
              type: initial.type,
              address: initial.address,
              city: initial.city,
              gisUrl: initial.gisUrl ?? "",
              price: initial.price,
              rentPeriod: initial.rentPeriod,
              description: initial.description,
              contactPhones: initial.contactPhones,
              whatsappPhones: initial.whatsappPhones,
            }
          : { rentPeriod: "month", contactPhones: [""], whatsappPhones: [] }
      }
    >
      <Form.Item name="type" label={t("typeLabel")} rules={[{ required: true }]}>
        <Select
          size="large"
          options={PropertyType.options.map((v) => ({
            value: v,
            label: tProp(`types.${v}` as "types.apartment"),
          }))}
        />
      </Form.Item>

      <Form.Item name="city" label={t("cityLabel")} rules={[{ required: true }]}>
        <CitySelect />
      </Form.Item>

      <Form.Item name="address" label={t("addressLabel")} rules={[{ required: true, min: 3 }]}>
        <Input size="large" />
      </Form.Item>

      <Form.Item
        name="gisUrl"
        label={t("gisUrl")}
        extra={t("gisUrlHint")}
        rules={[{ type: "url", warningOnly: false, required: false }]}
      >
        <Input size="large" placeholder="https://2gis.kz/almaty/geo/..." />
      </Form.Item>

      <div className="grid grid-cols-2 gap-3">
        <Form.Item name="price" label={t("priceLabel")} rules={[{ required: true }]}>
          <InputNumber
            size="large"
            className="!w-full"
            min={1}
            step={1000}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
          />
        </Form.Item>
        <Form.Item name="rentPeriod" label={t("rentPeriodLabel")} rules={[{ required: true }]}>
          <Segmented
            block
            size="large"
            options={RentPeriod.options.map((v) => ({
              label: tProp(`rentPeriod.${v}` as "rentPeriod.month"),
              value: v,
            }))}
          />
        </Form.Item>
      </div>

      <Form.Item name="description" label={t("descriptionLabel")}>
        <Input.TextArea rows={4} maxLength={5000} showCount />
      </Form.Item>

      <Form.List name="contactPhones">
        {(fields, { add, remove }) => (
          <Form.Item label={t("contactPhones")} required>
            <div className="flex flex-col gap-2">
              {fields.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <Form.Item
                    name={field.name}
                    noStyle
                    rules={[{ required: true, message: t("contactPhones") }]}
                  >
                    <PhoneInput size="middle" />
                  </Form.Item>
                  {fields.length > 1 && (
                    <Button
                      type="text"
                      icon={<Trash2 size={16} />}
                      onClick={() => remove(field.name)}
                    />
                  )}
                </div>
              ))}
              {fields.length < 3 && (
                <Button type="dashed" icon={<Plus size={16} />} onClick={() => add("")}>
                  {t("addPhone")}
                </Button>
              )}
            </div>
          </Form.Item>
        )}
      </Form.List>

      <Form.List name="whatsappPhones">
        {(fields, { add, remove }) => (
          <Form.Item label={t("whatsappPhones")}>
            <div className="flex flex-col gap-2">
              {fields.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <Form.Item name={field.name} noStyle rules={[{ required: true }]}>
                    <PhoneInput size="middle" />
                  </Form.Item>
                  <Button
                    type="text"
                    icon={<Trash2 size={16} />}
                    onClick={() => remove(field.name)}
                  />
                </div>
              ))}
              {fields.length < 3 && (
                <Button type="dashed" icon={<Plus size={16} />} onClick={() => add("")}>
                  {t("addPhone")}
                </Button>
              )}
            </div>
          </Form.Item>
        )}
      </Form.List>

      <Form.Item label={t("photos")} extra={t("uploadHint")}>
        <Upload
          listType="picture-card"
          fileList={fileList}
          onChange={({ fileList: next }) => setFileList(next.slice(0, 10))}
          beforeUpload={() => false}
          accept="image/jpeg,image/png,image/webp"
          multiple
        >
          {fileList.length < 10 && (
            <div className="flex flex-col items-center gap-1 text-gray-500">
              <ImagePlus size={20} />
            </div>
          )}
        </Upload>
      </Form.Item>

      <Button type="primary" size="large" htmlType="submit" block loading={loading}>
        {submitLabel}
      </Button>
    </Form>
  );
};
