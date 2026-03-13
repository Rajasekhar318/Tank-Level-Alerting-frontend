import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
 
import { Generator } from '../models/generator';
import { Reading } from '../models/reading';
import { Alert } from '../models/alert';
 
@Injectable({
  providedIn: 'root'
})
export class ApiService {
 
  baseUrl = "http://localhost:8081";
 
  constructor(private http: HttpClient) {}
 
  getGenerators(): Observable<Generator[]> {
    return this.http.get<Generator[]>(this.baseUrl + "/generators");
  }
 
  getGeneratorById(id:number){
    return this.http.get<Generator>(this.baseUrl + "/generators/" + id);
  }
 
  getReadings(): Observable<Reading[]> {
    return this.http.get<Reading[]>(this.baseUrl + "/readings");
  }
 
  getReadingById(id:number){
    return this.http.get<Reading>(this.baseUrl + "/readings/" + id);
  }
 
  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.baseUrl + "/alerts");
  }
 
  getAlertById(id:number){
    return this.http.get<Alert>(this.baseUrl + "/alerts/" + id);
  }
 
}
