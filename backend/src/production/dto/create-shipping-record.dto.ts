export class CreateShippingRecordDto {
  shipDate: string;
  workshopId: number;
  productSpecId: number;
  totalPackageCount?: number = 0;
  totalWeight?: number = 0;
  exportPackageCount?: number = 0;
  exportWeight?: number = 0;
  domesticPackageCount?: number = 0;
  domesticWeight?: number = 0;
  trainSectionCount?: number = 0;
  containerCount?: number = 0;
  truckCount?: number = 0;
  remark?: string;
}
