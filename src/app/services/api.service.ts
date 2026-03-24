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

  // =========================
  // GENERATORS
  // =========================

  getGenerators(): Observable<Generator[]> {
    const timestamp = new Date().getTime();
    return this.http.get<Generator[]>(`${this.baseUrl}/generators?_t=${timestamp}`);
  }

  getGeneratorById(id: number) {
    return this.http.get<Generator>(`${this.baseUrl}/generators/${id}`);
  }

  addGenerator(generatorData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/generators`, generatorData);
  }

  // ✅ START / STOP GENERATOR (MATCHES BACKEND)
  startGenerator(id: number) {
    return this.http.put(`${this.baseUrl}/generators/start/${id}`, {});
  }

  stopGenerator(id: number) {
    return this.http.put(`${this.baseUrl}/generators/stop/${id}`, {});
  }

  // =========================
  // READINGS
  // =========================

  getReadings(): Observable<Reading[]> {
    const timestamp = new Date().getTime();
    return this.http.get<Reading[]>(`${this.baseUrl}/readings?_t=${timestamp}`);
  }

  getReadingById(id: number) {
    return this.http.get<Reading>(`${this.baseUrl}/readings/${id}`);
  }

  addReading(readingData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/readings`, readingData);
  }

  // =========================
  // ALERTS
  // =========================

  getAlerts(): Observable<Alert[]> {
    const timestamp = new Date().getTime();
    return this.http.get<Alert[]>(`${this.baseUrl}/alerts?_t=${timestamp}`);
  }

  getAlertById(id: number) {
    return this.http.get<Alert>(`${this.baseUrl}/alerts/${id}`);
  }

  // =========================
  // FUEL MACHINES
  // =========================

  getMachines(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/machines`);
  }

  // ✅ START / STOP FUEL MACHINE (MATCHES BACKEND)
  startMachine(id: number) {
    return this.http.put(`${this.baseUrl}/machines/on/${id}`, {});
  }

  stopMachine(id: number) {
    return this.http.put(`${this.baseUrl}/machines/off/${id}`, {});
  }

  // =========================
  // GENERIC METHODS (FOR FLEXIBILITY)
  // =========================

  manualPost(endpoint: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${endpoint}`, data);
  }

  // 🔥 IMPORTANT FIX (YOUR ERROR WAS HERE)
  manualPut(endpoint: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${endpoint}`, data);
  }

}