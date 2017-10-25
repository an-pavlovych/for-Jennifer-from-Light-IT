export interface Thumb {
  url?: any;
}

export interface Avatar {
  url?: any;
  thumb: Thumb;
  large_thumb: Thumb;
}

export interface Agency {
  id: number;
  name: string;
  subdomain: string;
  state: string;
  created_at: number;
  updated_at: number;
}

export class Profile {
  public id: number;
  public email: string;
  public fullName: string;
  public phone: string;
  public roles: string[] = [];
  public avatar: Avatar | any;
  public agency: Agency;
  public send_email_on_application: boolean = false; // tslint:disable-line

  public get firstName() {
    if (!this.fullName) {
      return 'Guest';
    }
    return this.fullName.split(' ')[0];
  }

  public get phoneToForm() {
    let phone = this.phone.replace('+1', '');
    phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    return phone;
  }

  constructor({
                id,
                email,
                full_name,
                phone,
                avatar,
                send_email_on_application,
                agency,
                roles
              }: any) {
    this.id = id;
    this.email = email;
    this.fullName = full_name;
    this.phone = phone;
    this.avatar = avatar || {};
    this.agency = agency;
    if (roles) {
      this.roles = roles.map((role) => role && role.name);
    }
    this.send_email_on_application = send_email_on_application;

  }

  public toEditForm() {
    return {
      full_name: this.fullName,
      email: this.email,
      phone: this.phoneToForm,
      avatar: this.avatar.url,
      send_email_on_application: this.send_email_on_application
    };
  }
}
