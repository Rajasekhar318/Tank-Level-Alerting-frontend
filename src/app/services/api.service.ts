import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // <-- Added HttpHeaders
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
    const timestamp = new Date().getTime(); 
    return this.http.get<Generator[]>(`${this.baseUrl}/generators?_t=${timestamp}`);
  }
 
  getGeneratorById(id:number){
    return this.http.get<Generator>(this.baseUrl + "/generators/" + id);
  }
 
  getReadings(): Observable<Reading[]> {
    const timestamp = new Date().getTime(); 
    return this.http.get<Reading[]>(`${this.baseUrl}/readings?_t=${timestamp}`);
  }
 
  getReadingById(id:number){
    return this.http.get<Reading>(this.baseUrl + "/readings/" + id);
  }
 
  // --- UPDATED: Added headers to prevent browser caching ---
  // --- BULLETPROOF CACHE BUSTER ---
  getAlerts(): Observable<Alert[]> {
    const timestamp = new Date().getTime(); 
    return this.http.get<Alert[]>(`${this.baseUrl}/alerts?_t=${timestamp}`);
  }
 
  getAlertById(id:number){
    return this.http.get<Alert>(this.baseUrl + "/alerts/" + id);
  }
 
}