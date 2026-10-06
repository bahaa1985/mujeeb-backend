import { createPharmacyService, getAllPharmaciesService, getPharmacyByIdService, updatePharmacyService } from "./pharmacy.service";

const serializePharmacy = (pharmacy: any) => {
    return {
        ...pharmacy,
        id: Number(pharmacy.id)
    }
}

export const createPharamcyController = async (req: any, res: any) => {
    if (Number(req.user?.role_id) !== 1) return res.status(403).json({ error: 'Forbidden' });
    const { pharmacy_name, pharmacy_address,work_time,delivery,delivery_price,logo } = req.body
    try {
        const newPharmacy = await createPharmacyService(pharmacy_name, pharmacy_address,work_time,delivery,delivery_price,logo)
        res.status(201).json(serializePharmacy(newPharmacy))
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create pharmacy' })
    }
}

export const getAllPharmaciesController = async (req: any, res: any) => {
    try {
        if (Number(req.user?.role_id) !== 1) {
            const pharmacy = await getPharmacyByIdService(Number(req.user?.pharmacy_id));
            return res.status(200).json(pharmacy ? [serializePharmacy(pharmacy)] : []);
        }
        const pharmacies = await getAllPharmaciesService()
        res.status(201).json(pharmacies.map(serializePharmacy))
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch pharmacies' })
    }
}

export const getPharmacyByIdController = async (req: any, res: any) => {
    const id = Number(req.user?.role_id) === 1 ? Number(req.params.id) : Number(req.user?.pharmacy_id)
    try {
        const pharmacy = await getPharmacyByIdService(Number(id))
        res.status(201).json(serializePharmacy(pharmacy))
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch pharmacy' })
    }
}

export const updatePharmacyController = async (req: any, res: any) => {
    if (Number(req.user?.role_id) !== 1 && Number(req.params.id) !== Number(req.user?.pharmacy_id)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const id = Number(req.user?.role_id) === 1 ? req.params.id : req.user.pharmacy_id
    const { pharmacy_name, pharmacy_address,work_time,delivery,delivery_price,logo } = req.body
    try {
        await updatePharmacyService(id, pharmacy_name, pharmacy_address,work_time,delivery,logo,delivery_price)
        res.status(200).json({ message: 'Pharmacy updated successfully' })
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update pharmacy' })
    }
}