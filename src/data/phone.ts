import { getCountries, getCountryCallingCode, getExampleNumber, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max'
import mobileExamples from 'libphonenumber-js/mobile/examples'

const preferredCountries: CountryCode[] = ['TW', 'HK', 'MO', 'CN', 'JP', 'KR', 'SG', 'MY', 'US', 'CA']
const countryNames = new Intl.DisplayNames(['zh-TW'], { type: 'region' })
const allCountries = getCountries()

export const phoneCountries = [
  ...preferredCountries,
  ...allCountries.filter((country) => !preferredCountries.includes(country)).sort((a, b) =>
    (countryNames.of(a) ?? a).localeCompare(countryNames.of(b) ?? b, 'zh-TW'),
  ),
].map((country) => ({
  country,
  label: `${countryNames.of(country) ?? country} (+${getCountryCallingCode(country)})`,
}))

export function phoneExample(country: CountryCode): string {
  return getExampleNumber(country, mobileExamples)?.formatNational() ?? '輸入當地電話號碼'
}

/** 依所選國家／地區驗證，儲存為 E.164 國際格式。 */
export function normalizePhone(raw: string, country: CountryCode): string | null {
  const parsed = parsePhoneNumberFromString(raw.trim(), country)
  return parsed?.country === country && parsed.isValid() ? parsed.number : null
}
