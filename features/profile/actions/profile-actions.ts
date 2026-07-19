"use server"

import { revalidatePath } from "next/cache"
import { extractApiMessage } from "@/lib/api/utils"
import { getSession, saveSession } from "@/lib/auth/session"
import {
  updateProfileApi,
  addAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
  getAddressesApi,
  type FullUser,
  type UserAddress,
  type AddressPayload,
} from "../api/profile"

export interface ActionResult<T = undefined> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// ---------------------------------------------------------------------------
// Update Profile Action
// ---------------------------------------------------------------------------

export async function updateProfileAction(
  formData: FormData
): Promise<ActionResult<FullUser>> {
  try {
    const updatedUser = await updateProfileApi(formData)

    // Update session user details in Iron Session
    const session = await getSession()
    if (session.user) {
      session.user.firstName = updatedUser.firstName
      session.user.lastName = updatedUser.lastName
      session.user.email = updatedUser.email
      await saveSession(session)
    }

    revalidatePath("/[locale]/profile", "page")

    return {
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    }
  } catch (error) {
    console.error("[updateProfileAction]", error)
    return {
      success: false,
      error: "Update Failed",
      message: extractApiMessage(error, "Failed to update profile"),
    }
  }
}

// ---------------------------------------------------------------------------
// Add Address Action (Max 4 Limit Enforced)
// ---------------------------------------------------------------------------

export async function addAddressAction(
  payload: AddressPayload
): Promise<ActionResult<UserAddress[]>> {
  try {
    const currentAddresses = await getAddressesApi()
    if (currentAddresses.length >= 4) {
      return {
        success: false,
        error: "Limit Reached",
        message: "Maximum limit of 4 addresses reached.",
      }
    }

    const updatedAddresses = await addAddressApi(payload)
    revalidatePath("/[locale]/profile", "page")

    return {
      success: true,
      data: updatedAddresses,
      message: "Delivery address added successfully",
    }
  } catch (error) {
    console.error("[addAddressAction]", error)
    return {
      success: false,
      error: "Action Failed",
      message: extractApiMessage(error, "Failed to add address"),
    }
  }
}

// ---------------------------------------------------------------------------
// Update Address Action
// ---------------------------------------------------------------------------

export async function updateAddressAction(
  addressId: string,
  payload: Partial<AddressPayload>
): Promise<ActionResult<UserAddress[]>> {
  try {
    const updated = await updateAddressApi(addressId, payload)
    revalidatePath("/[locale]/profile", "page")

    return {
      success: true,
      data: updated,
      message: "Address updated successfully",
    }
  } catch (error) {
    console.error("[updateAddressAction]", error)
    return {
      success: false,
      error: "Action Failed",
      message: extractApiMessage(error, "Failed to update address"),
    }
  }
}

// ---------------------------------------------------------------------------
// Delete Address Action
// ---------------------------------------------------------------------------

export async function deleteAddressAction(
  addressId: string
): Promise<ActionResult<UserAddress[]>> {
  try {
    const remainingAddresses = await deleteAddressApi(addressId)
    revalidatePath("/[locale]/profile", "page")

    return {
      success: true,
      data: remainingAddresses,
      message: "Address deleted successfully",
    }
  } catch (error) {
    console.error("[deleteAddressAction]", error)
    return {
      success: false,
      error: "Action Failed",
      message: extractApiMessage(error, "Failed to delete address"),
    }
  }
}

// ---------------------------------------------------------------------------
// Set Address as Default Action
// ---------------------------------------------------------------------------

export async function setDefaultAddressAction(
  addressId: string
): Promise<ActionResult<UserAddress[]>> {
  try {
    const updatedList = await setDefaultAddressApi(addressId)
    revalidatePath("/[locale]/profile", "page")

    return {
      success: true,
      data: updatedList,
      message: "Active delivery address updated",
    }
  } catch (error) {
    console.error("[setDefaultAddressAction]", error)
    return {
      success: false,
      error: "Action Failed",
      message: extractApiMessage(error, "Failed to set default address"),
    }
  }
}
