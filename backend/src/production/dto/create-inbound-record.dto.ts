export class CreateInboundRecordDto {
  recordDate: string;
  workshopId: number;
  productSpecId: number;
  totalPackageCount?: number = 0;
  totalWeight?: number = 0;
  exportPackageCount?: number = 0;
  exportWeight?: number = 0;
  domesticPackageCount?: number = 0;
  domesticWeight?: number = 0;
  remark?: string;
}
