import request from '@/services/api'

export interface DriverLoginData {
    numberPlate: string
    accessToken: string
    expiresAt: string
}

export interface DriverLoginResponse {
    success: boolean
    message: string
    data: DriverLoginData
}

export interface DriverPlateItem {
    numberPlate: string
}

export interface DriverPlateListResponse {
    success: boolean
    message: string
    data: DriverPlateItem[]
}

export default {
    postDriverLogin(data: { numberPlate: string }) {
        return request.post<DriverLoginResponse>(`sbr/DriverLogin/Login`, data)
    },

    getVehicles(params?: unknown) {
        return request.get<DriverPlateListResponse>(`sbr/DriverLogin/GetVehicles`, params)
    },
}
