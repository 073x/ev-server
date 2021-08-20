import FeatureToggles, { Feature } from '../../utils/FeatureToggles';
import { PricingSetting, PricingSettingsType } from '../../types/Setting';

import BuiltInPricingIntegration from './simple-pricing/BuiltInPricingIntegration';
import ConvergentChargingPricingIntegration from './export/convergent-charging';
import DummyPricingIntegration from './dummy/DummyPricingIntegration';
import PricingIntegration from './PricingIntegration';
import SettingStorage from '../../storage/mongodb/SettingStorage';
import SimplePricingIntegration from './simple-pricing/SimplePricingIntegration';
import Tenant from '../../types/Tenant';
import TenantComponents from '../../types/TenantComponents';
import Utils from '../../utils/Utils';

export default class PricingFactory {
  static async getPricingImpl(tenant: Tenant): Promise<PricingIntegration<PricingSetting>> {
    // Check if the pricing is active
    if (Utils.isTenantComponentActive(tenant, TenantComponents.PRICING)) {
      // Get the pricing settings
      const pricingSetting = await SettingStorage.getPricingSettings(tenant);
      // Check
      if (pricingSetting) {
        let pricingIntegrationImpl;
        switch (pricingSetting.type) {
          // SAP Convergent Charging
          case PricingSettingsType.CONVERGENT_CHARGING:
            // SAP Convergent Charging implementation
            pricingIntegrationImpl = new ConvergentChargingPricingIntegration(tenant, pricingSetting.convergentCharging);
            break;
          // Simple Pricing
          case PricingSettingsType.SIMPLE:
            // Simple Pricing implementation
            if (FeatureToggles.isFeatureActive(Feature.PRICING_NEW_MODEL)) {
              // TODO - to be clarified - feature hidden behind a feature toggle for now!
              // Do we need a dedicated PricingSettingsType?
              pricingIntegrationImpl = new BuiltInPricingIntegration(tenant, pricingSetting.simple);
            } else {
              pricingIntegrationImpl = new SimplePricingIntegration(tenant, pricingSetting.simple);
            }
            break;
          default:
            pricingIntegrationImpl = null;
            break;
        }
        // Check if missing implementation
        if (pricingIntegrationImpl instanceof DummyPricingIntegration) {
          pricingIntegrationImpl = null;
        }
        // Return the Pricing Integration implementation
        return pricingIntegrationImpl;
      }
    }
    // Pricing is not active
    return null;
  }
}

