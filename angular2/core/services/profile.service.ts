import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiHttpService } from './api-http.service';
import { ApiConfig } from '../../helpers/api-config';
import { Profile } from './profile.model';
import { SessionService } from './session.service';

@Injectable()
export class ProfileService {

  private _state = new BehaviorSubject<Profile>(null);

  constructor(private api: ApiHttpService, private _session: SessionService) {
    const usrTmp = JSON.parse(localStorage.getItem('user'));
    if (usrTmp) {
      this._state.next(new Profile(usrTmp));
    }
    _session.state.subscribe((loggedIn) => {
      if (!loggedIn) {
        return;
      }
      this.loadData().subscribe(() => {
        return '';
      });
    });
    this.state.subscribe((v) => {
      if (v) {
        localStorage.setItem('user', JSON.stringify(v));
      }
    });
  }

  public get state(): Observable<Profile | null> {
    return this._state.asObservable();
  }

  public loadData() {
    return this.api.get(ApiConfig.userInfo).map((res) => {
      const json = new Profile(res.json());
      this._state.next(json);
      return json;
    });
  }

  public update(data) {
    return this.api.put(ApiConfig.userInfo, {user: data}).mergeMap(() => this.loadData());
  }

}
