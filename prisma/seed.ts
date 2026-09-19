import { prismaClient } from "../utils/prisma-adapter";
import bcrypt from 'bcrypt'

async function main() {
    console.log('--- SEED FILE EXECUTED ---')
    // إضافة الخطط الأساسية لجدول plans
    await prismaClient.plans.createMany({
        data: [
            {
                name:'trial',
                messages_limit:1000,
                price:0,
                common_replies:true,
                prescription_reader:true,
                prescription_reader_100:false,
                order_notification:true,
                basic_dashboard:true,
                advanced_dashboard:false
            },
            {
                name: 'Basic',
                messages_limit: 800,
                price: 500.00,
                common_replies: true,
                prescription_reader_100: false,
                prescription_reader: false,
                order_notification: false,
                basic_dashboard: true,
                advanced_dashboard: false,
            },
            {
                name: 'Pro',
                messages_limit: 1800,
                price: 900.00,
                common_replies: true,
                prescription_reader_100: true,
                prescription_reader: true,
                order_notification: true,
                basic_dashboard: true,
                advanced_dashboard: true,
            },
            {
                name: 'elite',
                messages_limit: 4000,
                price: 1300.00,
                common_replies: true,
                prescription_reader_100: true,
                prescription_reader: true,
                order_notification: true,
                basic_dashboard: true,
                advanced_dashboard: true,
            },
        ],
        skipDuplicates: true, // لتجنب الأخطاء إذا كانت البيانات موجودة بالفعل
    })
    console.log("plans are created successfully")

    await prismaClient.user_roles.createMany({
        data: [
            { role_name: 'Super Admin' },
            { role_name: 'Owner' },
            { role_name: 'Employee' },
        ]
    })
console.log("roles are created successfully")

    await prismaClient.pharmacies.create({
        data: {
            pharmacy_name: 'Smoke Test Pharmacy',
            pharmacy_address: '123 Main St',
            delivery: true,
            workTime: '24/7',
            is_active: true
        }
    })
console.log("smoke test pharmacy are created successfully")

    const plainPassword = 'aaaaaaaa'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    await prismaClient.users.upsert({
    where: { mobile: '201221483799' },
    update: {
      password: hashedPassword,
      role_id: 1,
      pharmacy_id: 1,
      is_active: true,
        instance_name:'Bahaa Salah'
    },
    create: {
      username: 'bahaa salah',
      mobile: '201221483799',
      password: hashedPassword,
      pharmacy_id: 1,
      role_id: 1,
      is_active: true,
      ai_mode: true,
      instance_name:'Bahaa Salah'
    },
  })
    console.log("super admin are created successfully")

    await prismaClient.message_types.createMany({
        data: [
            { message_type: 'text' },
            { message_type: 'medicine_box' },
            { message_type: 'image' },
            { message_type: 'medical_prescription' },
            { message_type: 'AI_response' },
            { message_type: 'human_response' },
            { message_type: 'greeting' },
            { message_type: 'error' },
            { message_type: 'deleted' },
            { message_type: 'alert' },
            { message_type: 'order' },
            { message_type: 'other' },
        ]
    })
console.log("message types are created successfully")
    

    console.log('Seed completed successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prismaClient.$disconnect()
    })