import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Patterns } from '../ot/helpers/patterns';
import { OtValidators } from '../helpers/ot-validators';
import { Mask } from '../ot/helpers/mask';
import { ProfileService } from '../ot/services/profile.service';
import { OverlayNotificationsService } from '../ot/components/overlay-notifications/overlay-notifications.service';
import { OverlayNotificationModel } from '../ot/components/overlay-notifications/overlay-notification.model';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'ot-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProfileComponent implements OnInit {
  public profileSave: boolean;
  public avatar: string = null;
  public form: FormGroup;
  public errors: any = {};
  public phoneMask = Mask.PHONE_WITHOUT_EXT;
  public showPassFields: boolean = false;
  private removePhoto: boolean;

  constructor(private _profileService: ProfileService, private fb: FormBuilder,
              private notificationService: OverlayNotificationsService, title: Title) {
    title.setTitle(`Profile - OfficeTroop`);
  }

  public ngOnInit() {
    this.form = this.fb.group({
      full_name: ['', [Validators.required]],
      email: ['', [Validators.required, OtValidators.email]],
      phone: ['', [Validators.required, Validators.pattern(Patterns.PHONE)]],
      current_password: [''],
      password: [''],
      avatar: [''],
      send_email_on_application: [true]
    });
    this._profileService.loadData().subscribe((data) => {
      this.form.patchValue(data.toEditForm());
    });
  }

  public openPassSection() {
    this.errors = [];
    this.showPassFields = true;
    this.setValidatorsToPassFields([Validators.required, Validators.minLength(8), Validators.maxLength(100), Validators.pattern(Patterns.PASSWORD)]);
  }

  public closePassSection() {
    this.showPassFields = false;
    this.setValidatorsToPassFields();
    this.form.get('current_password').reset();
    this.form.get('password').reset();
  }

  public changePhoto(photo) {
    this.removePhoto = !photo;
  }

  public submitForm($event) {
    $event.preventDefault();
    if (this.form.invalid) {
      return;
    }
    const data = this.form.value;
    if (this.removePhoto) {
      data.remove_avatar = true;
    }
    if (!this.showPassFields) {
      delete data.password;
      delete data.current_password;
    }
    this.profileSave = true;
    this._profileService.update(data).subscribe(() => {
      this.notificationService.add(new OverlayNotificationModel({
        type: 'success',
        text: 'Your changes have been saved',
        timeout: 3000
      }));
      this.showPassFields = false;
      this.form.get('current_password').reset();
      this.form.get('password').reset();
      this.profileSave = false;
    }, (err) => {
      this.errors = err.json().error;
      this.profileSave = false;
    });
  }

  private setValidatorsToPassFields(validators?) {
    const currentPassField = this.form.get('current_password');
    const newPassField = this.form.get('password');
    if (validators) {
      currentPassField.setValidators(validators[0]);
      newPassField.setValidators(validators);
      currentPassField.updateValueAndValidity();
      newPassField.updateValueAndValidity();
    } else {
      currentPassField.setValidators(null);
      newPassField.setValidators(null);
      currentPassField.updateValueAndValidity();
      newPassField.updateValueAndValidity();
    }
  }
}
