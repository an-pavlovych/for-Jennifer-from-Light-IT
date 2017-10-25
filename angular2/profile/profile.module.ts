import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { OtModule } from '../shared/ot.module';
import { ProfileComponent } from './profile.component';

@NgModule({
  imports: [
    CommonModule,
    ProfileRoutingModule,
    OtModule
  ],
  declarations: [
    ProfileComponent
  ]
})
export class ProfileModule { }
