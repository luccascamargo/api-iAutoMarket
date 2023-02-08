/* eslint-disable no-useless-escape */
import { Router, raw, Request, Response } from "express";
import Stripe from "stripe";

import { OptionalController } from "./controllers/OptionalController";
import { AdvertController } from "./controllers/AdvertController";
import { UsersController } from "./controllers/UsersController";
import { getCep } from "./middlewares/cep";
import { upload } from "./middlewares/cloudS3";
import { deletePhotos } from "./middlewares/deleteExistingPhotos";
import { getPhotosInAdvert } from "./middlewares/getPhotosInAdvert";
import { prisma } from "./utils/prisma";

const advertController = new AdvertController();
const userController = new UsersController();
const optionalController = new OptionalController();

const stripe = new Stripe(
  "sk_test_51LkaS4B3rHMTUjVLcV0PhmWjwxnqagJPLR1eOgZn4epLKRtDAsbsp9RdzWtUVIrMs28X3hb9G3WVaq2d11U9ysXO00Sgwv34sK",
  {
    apiVersion: "2022-11-15",
  }
);

const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET || "";

export const router = Router();

router.get("/users", userController.index);
router.get("/user/:id", userController.findUserPerId);
router.put("/user", userController.updateUSer);

router.get("/advert/:id", advertController.IndexPerId);
router.get("/advertPerUser/:user/:condition", advertController.IndexPerUser);
router.post("/filtered", advertController.filtered);
router.put("/publish", advertController.publishAdvert);

router.get("/optionals", optionalController.index);
router.post("/create-optional", optionalController.store);

router.post(
  "/create-advert",
  upload.array("image-create"),
  getCep,
  advertController.store
);

router.put(
  "/update-advert",
  upload.array("image-update"),
  getPhotosInAdvert,
  advertController.deleteExistingPhotos,
  deletePhotos,
  getCep,
  advertController.update
);

router.delete(
  "/delete-advert",
  getPhotosInAdvert,
  deletePhotos,
  advertController.delete
);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { customer_id, key } = req.body.data;
    const customer = await stripe.customers.retrieve(customer_id);

    const subscriptionAlreadyExists = await prisma.subscriptions.findFirst({
      where: {
        customer_id: customer.id,
        AND: {
          status: true,
        },
      },
    });

    if (subscriptionAlreadyExists) {
      const session = await stripe.billingPortal.sessions.create({
        customer: subscriptionAlreadyExists.customer_id,
        return_url: "http://localhost:3000/?canceled=true",
      });
      return res.status(200).json(session.url);
    }

    if (key) {
      const session = await stripe.checkout.sessions.create({
        billing_address_collection: "auto",
        customer: customer.id,
        line_items: [
          {
            price: key,
            // For metered billing, do not pass quantity
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `http://localhost:3000?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:3000/?canceled=true`,
      });

      res.status(200).json(session.url);
    }
  } catch (err) {
    console.log(err);

    res.status(200).json({ message: "" });
  }
});

router.post("/create-customer", async (req, res) => {
  try {
    const { firstName, email } = req.body.data;
    const customerAlreadyExists = await stripe.customers.search({
      query: `email:"${email}"`,
    });

    if (customerAlreadyExists.data.length === 0) {
      const customer = await stripe.customers.create({
        email,
        name: `${firstName}`,
      });

      if (customer) {
        const userAlreadyExists = await prisma.users.findFirst({
          where: {
            email: customer.email!,
          },
        });

        if (userAlreadyExists) {
          return res
            .status(400)
            .json({ message: "Usuário ja existente na base de dados" });
        }

        await prisma.users.create({
          data: {
            email: customer.email!,
            customer_id: customer.id,
            name: customer.name!,
            stripe_product_id: "DEFAULT",
          },
        });
      }
      return res.json({ message: "Criou um customer" });
    }
    return res.json({ message: "Customer ja existe" });
  } catch (err) {
    console.log(err);

    return res.status(200).json({ message: "Erro ao criar um customer" });
  }
});

router.post(
  "/webhook-stripe",
  raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature as string,
        webhookSecret
      );
    } catch (err) {
      //@ts-ignore
      console.log(`⚠️  Webhook signature falhou.`, err.message);
      return res.sendStatus(400);
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        // @ts-ignore
        const stripeSubscriptionId = event.data.object.id;
        // @ts-ignore
        const status = event.data.object.status;
        // @ts-ignore
        const stripeCustomerId = event.data.object.customer;
        // @ts-ignore
        const stripeProductId = event.data.object.plan.id;
        // @ts-ignore
        const stripeSubscription_current_period_start = new Date(
          // @ts-ignore
          event.data.object.current_period_start * 1000
        );
        // @ts-ignore
        const stripeSubscription_current_period_end = new Date(
          // @ts-ignore
          event.data.object.current_period_end * 1000
        );

        const user = await prisma.users.findFirst({
          where: {
            customer_id: stripeCustomerId,
          },
        });

        const subscription = await prisma.subscriptions.findFirst({
          where: {
            customer_id: stripeCustomerId,
            subscription_id: stripeSubscriptionId,
            status: true,
          },
        });

        if (subscription) {
          console.log("caiu no update");

          //update
          await prisma.subscriptions.update({
            where: {
              id: subscription.id,
            },
            data: {
              status: status === "active",
              stripe_product_id: stripeProductId,
              current_period_end: subscription.current_period_end,
              current_period_start: subscription.current_period_start,
            },
          });

          if (stripeProductId === "price_1MEJNVB3rHMTUjVLfaCFAZgz") {
            await prisma.users.update({
              where: {
                email: user?.email,
              },
              data: {
                stripe_product_id: "SILVER",
              },
            });
          }
          if (stripeProductId === "price_1MEJLsB3rHMTUjVLONIaE6Wm") {
            await prisma.users.update({
              where: {
                email: user?.email,
              },
              data: {
                stripe_product_id: "GOLD",
              },
            });
          }
          if (stripeProductId === "price_1MEJN4B3rHMTUjVLvNH9ZigW") {
            await prisma.users.update({
              where: {
                email: user?.email,
              },
              data: {
                stripe_product_id: "PLATINUM",
              },
            });
          }

          await prisma.adverts.updateMany({
            where: {
              Users: {
                id: user?.id,
              },
            },
            data: {
              condition: "INACTIVE",
            },
          });

          if (status === "canceled") {
            await prisma.users.update({
              where: {
                email: user?.email,
              },
              data: {
                stripe_product_id: "DEFAULT",
              },
            });

            await prisma.adverts.updateMany({
              where: {
                Users: {
                  id: user?.id,
                },
              },
              data: {
                condition: "INACTIVE",
              },
            });
          }
        } else {
          //create
          await prisma.subscriptions.create({
            data: {
              customer_id: stripeCustomerId,
              status: true,
              user_id: user?.id,
              stripe_product_id: stripeProductId,
              subscription_id: stripeSubscriptionId,
              current_period_end: stripeSubscription_current_period_end,
              current_period_start: stripeSubscription_current_period_start,
            },
          });

          if (stripeProductId === "price_1MEJNVB3rHMTUjVLfaCFAZgz") {
            await prisma.users.update({
              where: {
                email: user?.email,
              },
              data: {
                stripe_product_id: "SILVER",
              },
            });
          }
          if (stripeProductId === "price_1MEJLsB3rHMTUjVLONIaE6Wm") {
            await prisma.users.update({
              where: {
                email: user?.email,
              },
              data: {
                stripe_product_id: "GOLD",
              },
            });
          }
          if (stripeProductId === "price_1MEJN4B3rHMTUjVLvNH9ZigW") {
            await prisma.users.update({
              where: {
                email: user?.email,
              },
              data: {
                stripe_product_id: "PLATINUM",
              },
            });
          }
        }
        break;
      }
      case "customer.subscription.completed":
        break;
      default:
        console.log(`Eventos nao ouvidos ${event.type}`);
    }

    return res.status(200);
  }
);

router.post("/sync-user", async (req: Request, res: Response) => {
  try {
    const { email } = req.body.data;

    const user = await prisma.users.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Usuário nao existe" });
    }

    return res.status(200).json({
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(404).json(err);
  }
});

router.get("/get-subscriptions/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscriptions = await prisma.subscriptions.findMany({
      where: {
        user_id: id,
      },
    });

    return res.status(200).json(subscriptions);
  } catch (err) {
    console.log(err);
    return res.status(400);
  }
});
