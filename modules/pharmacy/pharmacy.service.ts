import prisma from "@prisma/client";
import { prismaClient } from "../../utils/prisma-adapter"

export const createPharmacyService = async (
  pharmacy_name: string,
  pharmacy_address: string,
  work_time:string,
  delivery:boolean,
  delivery_price:number,
  logo:string
) => {
  try {
    const pharmacy = await prismaClient.pharmacies.create({
      data: {
        pharmacy_name,
        pharmacy_address,
        work_time,
        delivery,
        delivery_price,
        logo
      },
    });
    return pharmacy;
  } catch (error) {
    console.error("Error creating pharmacy:", error);
    throw error;
  }
};

export const getAllPharmaciesService = async () => {
  try {
    const pharmacies = await prismaClient.pharmacies.findMany();
    return pharmacies;
  } catch (error) {
    console.error("Error fetching pharmacies:", error);
    throw error;
  }
};

export const getPharmacyByIdService = async (id: number) => {
  try {
    const pharmacy = await prismaClient.pharmacies.findUnique({
      where: { id },
    });
    return pharmacy;
  } catch (error) {
    console.error("Error fetching pharmacy by id:", error);
    throw error;
  }
}

export const updatePharmacyService = async (id: number, pharmacy_name: string, pharmacy_address: string, work_time:string,delivery:boolean,logo:string,delivery_price:number) => {
  try {
    const updatedPharmacy = await prismaClient.pharmacies.update({
      where: { id: Number(id) },
      data: {
        pharmacy_name, pharmacy_address, work_time, delivery, logo, delivery_price
      }
    })
    return updatedPharmacy
  }
  catch (error) {
    console.error("Error updating pharmacy:", error)
    throw error
  }
}
