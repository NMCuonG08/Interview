import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const apiBase = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const customerRole = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    const customerPermissions =
      customerRole?.permissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}`
      ) ?? [];

    const merchant = await prisma.merchant.findFirst({
      where: { approvalStatus: 'APPROVED' },
      select: { id: true, externalId: true },
    });

    if (!merchant) {
      throw new Error('No APPROVED merchant found');
    }

    let product = await prisma.product.findFirst({
      where: {
        merchantId: merchant.id,
        isActive: true,
      },
      select: { externalId: true },
    });

    if (!product) {
      const created = await prisma.product.create({
        data: {
          merchantId: merchant.id,
          name: { vi: 'San pham test order flow' },
          description: { vi: 'Auto generated for verify-order-flow script' },
          price: 10000,
          currency: 'VND',
          isActive: true,
          stock: 20,
        },
        select: { externalId: true },
      });
      product = created;
    }

    const email = `flowtest_${Date.now()}@example.com`;
    const password = '123456';

    const registerResponse = await axios.post(`${apiBase}/auth/register`, {
      email,
      password,
      username: `flowtest_${Date.now()}`,
      phone: '0900000000',
    });

    const accessToken = registerResponse.data?.access_token as
      | string
      | undefined;
    if (!accessToken) {
      throw new Error('Register succeeded but no access_token returned');
    }

    const createOrderPayload = {
      merchantExternalId: merchant.externalId,
      items: [{ productExternalId: product.externalId, quantity: 1 }],
      deliveryAddressNote: 'Auto verification order from script',
    };

    const createOrderResponse = await axios.post(
      `${apiBase}/orders`,
      createOrderPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(
      JSON.stringify(
        {
          apiBase,
          customerPermissions,
          hasOrderCreatePermission:
            customerPermissions.includes('order:create'),
          merchantExternalId: merchant.externalId,
          productExternalId: product.externalId,
          orderCreateStatus: 'success',
          order: createOrderResponse.data,
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  console.error(
    JSON.stringify(
      {
        orderCreateStatus: 'failed',
        status,
        data,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      null,
      2
    )
  );

  process.exit(1);
});
