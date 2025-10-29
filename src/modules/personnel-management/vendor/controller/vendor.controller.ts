import { Controller, Get, Put, Post, UseGuards, Req, Body } from '@nestjs/common';
import { VendorService } from '../service/vendor.service';


@Controller('api/v1/vendors')

export class VendorController {
  constructor(private vendorService: VendorService) {}

}
