import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, OneToOne, JoinColumn, Index } from 'typeorm';
import { Vendor } from './vendor.entity';

export enum KYCStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  RESUBMISSION_REQUIRED = 'resubmission_required',
}

export enum DocumentType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driving_license',
  BUSINESS_LICENSE = 'business_license',
  TAX_CERTIFICATE = 'tax_certificate',
  TRADE_LICENSE = 'trade_license',
}

@Entity('vendor_kyc')
export class VendorKYC extends BaseEntity {
  @OneToOne(() => Vendor, (vendor) => vendor.kyc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  // Business information
  @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true })
  companyName?: string;

  @Column({ name: 'business_registration_number', type: 'varchar', length: 255, nullable: true })
  businessRegistrationNumber?: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 255, nullable: true })
  taxId?: string;

  @Column({ name: 'trade_license_number', type: 'varchar', length: 255, nullable: true })
  tradeLicenseNumber?: string;

  // Document URLs (encrypted/secured storage)
  @Column({ name: 'business_license_document', type: 'varchar', length: 500, nullable: true })
  businessLicenseDocument?: string;

  @Column({ name: 'tax_certificate_document', type: 'varchar', length: 500, nullable: true })
  taxCertificateDocument?: string;

  @Column({ name: 'owner_id_document', type: 'varchar', length: 500, nullable: true })
  ownerIdDocument?: string;

  @Column({ name: 'owner_id_type', type: 'enum', enum: DocumentType, nullable: true })
  ownerIdType?: DocumentType;

  @Column({ name: 'additional_documents', type: 'jsonb', nullable: true })
  additionalDocuments?: Record<string, any>; // Array of document URLs with metadata

  // KYC Status and workflow
  @Column({ name: 'status', type: 'enum', enum: KYCStatus, default: KYCStatus.NOT_SUBMITTED })
  status: KYCStatus;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'reviewed_by', type: 'integer', nullable: true })
  reviewedBy?: number; // Admin user ID

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes?: string;

  @Column({ name: 'resubmission_count', type: 'integer', default: 0 })
  resubmissionCount: number;
}