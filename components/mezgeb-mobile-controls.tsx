'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Locale = 'en' | 'am' | 'om' | 'ti' | 'so' | 'aa' | 'ar';
type Theme = 'light' | 'dark';
type AppView = 'dashboard' | 'ledger' | 'receipts' | 'dube' | 'reports' | 'operations';

type BusinessOption = {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  vatRegistered: boolean;
  businessType: string | null;
  tin: string | null;
  receiptPrefix: string;
  openingBalance: number;
};

type Props = {
  userName: string;
  activeBusinessId: string;
  businesses: BusinessOption[];
};

type SearchTransaction = {
  id: string;
  description: string;
  amount: number;
  payment_method: string;
  occurred_at: string;
  category: string | null;
  reference: string | null;
  notes: string | null;
};

type SearchCustomer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  balance: number;
  earliest_due_at: string | null;
};

type SearchReceipt = {
  id: string;
  receipt_number: string;
  total: number;
  issued_at: string;
  status: string;
};

type SearchItem = {
  id: string;
  view: AppView;
  icon: string;
  title: string;
  subtitle: string;
  keywords: string;
  type: 'section' | 'transaction' | 'customer' | 'receipt' | 'setting';
};

const localeOptions: Array<{ id: Locale; label: string; short: string; dir: 'ltr' | 'rtl' }> = [
  { id: 'en', label: 'English', short: 'EN', dir: 'ltr' },
  { id: 'am', label: 'አማርኛ', short: 'አማ', dir: 'ltr' },
  { id: 'om', label: 'Afaan Oromoo', short: 'OM', dir: 'ltr' },
  { id: 'ti', label: 'ትግርኛ', short: 'ትግ', dir: 'ltr' },
  { id: 'so', label: 'Soomaali', short: 'SO', dir: 'ltr' },
  { id: 'aa', label: 'Qafar af', short: 'AA', dir: 'ltr' },
  { id: 'ar', label: 'العربية', short: 'AR', dir: 'rtl' }
];

const navigation: Array<{ id: AppView; icon: string; label: string }> = [
  { id: 'dashboard', icon: '⌂', label: 'Dashboard' },
  { id: 'ledger', icon: '↕', label: 'Ledger' },
  { id: 'receipts', icon: '▤', label: 'Receipts' },
  { id: 'dube', icon: '◎', label: 'Dube' },
  { id: 'reports', icon: '⌁', label: 'Reports' },
  { id: 'operations', icon: '◇', label: 'Operations' }
];

const copy: Record<Exclude<Locale, 'en'>, Record<string, string>> = {
  am: {
    Dashboard: 'ዳሽቦርድ',
    Ledger: 'መዝገብ',
    Receipts: 'ደረሰኞች',
    Dube: 'ዱቤ',
    Reports: 'ሪፖርቶች',
    Operations: 'አስተዳደር',
    Welcome: 'እንኳን ደህና መጡ',
    Live: 'ቀጥታ',
    Refresh: 'አድስ',
    Menu: 'ምናሌ',
    Close: 'ዝጋ',
    'Help Center': 'የእገዛ ማዕከል',
    Search: 'ፈልግ',
    'Search everything in Biloo Mezgeb': 'በመዝገብ ውስጥ ሁሉንም ፈልግ',
    'Search transactions, customers, receipts and settings': 'ግብይቶችን፣ ደንበኞችን፣ ደረሰኞችን እና ቅንብሮችን ፈልግ',
    Language: 'ቋንቋ',
    Appearance: 'ገጽታ',
    'Light mode': 'ብርሃን ገጽታ',
    'Dark mode': 'ጨለማ ገጽታ',
    'Current business': 'የአሁኑ ንግድ',
    'Net position': 'የተጣራ ሁኔታ',
    Sales: 'ሽያጭ',
    Expenses: 'ወጪዎች',
    'Outstanding Dube': 'ያልተከፈለ ዱቤ',
    'VAT payable': 'የሚከፈል ተ.እ.ታ',
    'Calculated from saved records': 'ከተቀመጡ መዝገቦች የተሰላ',
    'VAT not enabled': 'ተ.እ.ታ አልነቃም',
    'Add sale': 'ሽያጭ ጨምር',
    'Add expense': 'ወጪ ጨምር',
    'Manage Dube': 'ዱቤን አስተዳድር',
    'Issue receipt': 'ደረሰኝ አውጣ',
    'Recent activity': 'የቅርብ ጊዜ እንቅስቃሴ',
    'Live ledger': 'ቀጥታ መዝገብ',
    'View all': 'ሁሉንም ይመልከቱ',
    'Customer credit': 'የደንበኛ ብድር',
    'Dube attention': 'ትኩረት የሚፈልግ ዱቤ',
    'Open Dube': 'ዱቤን ክፈት',
    'Business health': 'የንግድ ጤና',
    'Records are syncing': 'መዝገቦች እየተመሳሰሉ ነው',
    'Ready for the first record': 'ለመጀመሪያው መዝገብ ዝግጁ',
    'Cross-device data': 'በመሣሪያዎች መካከል ውሂብ',
    Active: 'ንቁ',
    'Row Level Security': 'የረድፍ ደረጃ ደህንነት',
    Enforced: 'ተግባራዊ',
    'New protected entry': 'አዲስ የተጠበቀ መዝገብ',
    'Record a transaction': 'ግብይት መዝግብ',
    Sale: 'ሽያጭ',
    Expense: 'ወጪ',
    Description: 'መግለጫ',
    'Amount in ETB': 'መጠን በብር',
    Category: 'ምድብ',
    'Payment method': 'የክፍያ ዘዴ',
    Cash: 'ጥሬ ገንዘብ',
    Bank: 'ባንክ',
    'Dube credit': 'የዱቤ ሽያጭ',
    Other: 'ሌላ',
    'Dube customer': 'የዱቤ ደንበኛ',
    'Choose customer': 'ደንበኛ ይምረጡ',
    'Due date': 'የመክፈያ ቀን',
    'Amount includes 15% VAT': 'መጠኑ 15% ተ.እ.ታን ያካትታል',
    'Save sale': 'ሽያጩን አስቀምጥ',
    'Save expense': 'ወጪውን አስቀምጥ',
    'Saving…': 'በማስቀመጥ ላይ…',
    'Transaction history': 'የግብይት ታሪክ',
    'No matching transactions.': 'የሚዛመድ ግብይት አልተገኘም።',
    'Customer profile': 'የደንበኛ መገለጫ',
    'Add Dube customer': 'የዱቤ ደንበኛ ጨምር',
    'Customer name': 'የደንበኛ ስም',
    Phone: 'ስልክ',
    'Credit limit in ETB': 'የብድር ገደብ በብር',
    'Add customer': 'ደንበኛ ጨምር',
    'Credit activity': 'የብድር እንቅስቃሴ',
    'Record Dube': 'ዱቤ መዝግብ',
    'Credit sale': 'የዱቤ ሽያጭ',
    Payment: 'ክፍያ',
    'Save credit sale': 'የዱቤ ሽያጩን አስቀምጥ',
    'Record payment': 'ክፍያ መዝግብ',
    'Outstanding accounts': 'ያልተከፈሉ ሂሳቦች',
    'Dube customers': 'የዱቤ ደንበኞች',
    'Professional documents': 'ሙያዊ ሰነዶች',
    'Receipt centre': 'የደረሰኝ ማዕከል',
    'Ready to issue': 'ለማውጣት ዝግጁ',
    'Receipt issued': 'ደረሰኝ ወጥቷል',
    'Live reporting': 'ቀጥታ ሪፖርት',
    'Business performance': 'የንግድ አፈጻጸም',
    'Mark reviewed': 'እንደተገመገመ ምልክት አድርግ',
    'Total sales': 'ጠቅላላ ሽያጭ',
    'Total expenses': 'ጠቅላላ ወጪ',
    'Positive recorded position': 'አዎንታዊ የተመዘገበ ሁኔታ',
    'Expenses exceed recorded sales': 'ወጪዎች ከተመዘገበው ሽያጭ በልጠዋል',
    'Dube exposure': 'የዱቤ ተጋላጭነት',
    'Output VAT': 'የሽያጭ ተ.እ.ታ',
    'From sales entries': 'ከሽያጭ መዝገቦች',
    'Net VAT payable': 'የተጣራ የሚከፈል ተ.እ.ታ',
    'Business configuration': 'የንግድ ቅንብር',
    'Add another business': 'ሌላ ንግድ ጨምር',
    'Business type': 'የንግድ ዓይነት',
    Location: 'አድራሻ',
    'VAT status': 'የተ.እ.ታ ሁኔታ',
    'VAT registered': 'ተ.እ.ታ የተመዘገበ',
    Standard: 'መደበኛ',
    'Receipt prefix': 'የደረሰኝ ቅድመ ቅጥያ',
    'Opening balance': 'መክፈቻ ቀሪ ሂሳብ',
    'Not added': 'አልተጨመረም',
    Transactions: 'ግብይቶች',
    Customers: 'ደንበኞች',
    'App sections': 'የመተግበሪያ ክፍሎች',
    Settings: 'ቅንብሮች',
    'No results found': 'ውጤት አልተገኘም',
    'Try another word or number.': 'ሌላ ቃል ወይም ቁጥር ይሞክሩ።'
  },
  om: {
    Dashboard: 'Daashboordii',
    Ledger: 'Galmee',
    Receipts: 'Nagaheewwan',
    Dube: 'Liqii',
    Reports: 'Gabaasota',
    Operations: 'Bulchiinsa',
    Welcome: 'Baga nagaan dhuftan',
    Live: 'Kallattiin',
    Refresh: 'Haaromsi',
    Menu: 'Tarree',
    Close: 'Cufi',
    'Help Center': 'Wiirtuu Gargaarsaa',
    Search: 'Barbaadi',
    'Search everything in Biloo Mezgeb': 'Biloo Mezgeb keessatti waan hunda barbaadi',
    'Search transactions, customers, receipts and settings':
      'Daldala, maamiltoota, nagaheewwan fi qindaaʼina barbaadi',
    Language: 'Afaan',
    Appearance: 'Bifa',
    'Light mode': 'Bifa ifaa',
    'Dark mode': 'Bifa dukkanaa',
    'Current business': 'Daldala ammaa',
    'Net position': 'Haala qulqulluu',
    Sales: 'Gurgurtaa',
    Expenses: 'Baasii',
    'Outstanding Dube': 'Liqii hin kaffalamne',
    'VAT payable': 'VAT kaffalamu',
    'Calculated from saved records': 'Galmeewwan kuufaman irraa shallagame',
    'VAT not enabled': 'VAT hin hojii irra oolle',
    'Add sale': 'Gurgurtaa dabali',
    'Add expense': 'Baasii dabali',
    'Manage Dube': 'Liqii bulchi',
    'Issue receipt': 'Nagahee baasi',
    'Recent activity': 'Sochii dhihoo',
    'Live ledger': 'Galmee kallattii',
    'View all': 'Hunda ilaali',
    'Customer credit': 'Liqii maamilaa',
    'Dube attention': 'Liqii xiyyeeffannoo barbaadu',
    'Open Dube': 'Liqii bani',
    'Business health': 'Fayyaa daldalaa',
    'Records are syncing': 'Galmeewwan wal-simsiifamaa jiru',
    'Ready for the first record': 'Galmee jalqabaaf qophaaʼe',
    'Cross-device data': 'Deetaa meeshaalee gidduu',
    Active: 'Hojii irra',
    'Row Level Security': 'Nageenya sadarkaa tarree',
    Enforced: 'Hojiirra oole',
    'New protected entry': 'Galmee eegamaa haaraa',
    'Record a transaction': 'Daldala galmeessi',
    Sale: 'Gurgurtaa',
    Expense: 'Baasii',
    Description: 'Ibsa',
    'Amount in ETB': 'Hanga Birrii',
    Category: 'Ramaddii',
    'Payment method': 'Mala kaffaltii',
    Cash: 'Maallaqa callaa',
    Bank: 'Baankii',
    'Dube credit': 'Gurgurtaa liqii',
    Other: 'Kan biraa',
    'Dube customer': 'Maamila liqii',
    'Choose customer': 'Maamila fili',
    'Due date': 'Guyyaa kaffaltii',
    'Amount includes 15% VAT': 'Hangi kun VAT 15% of keessaa qaba',
    'Save sale': 'Gurgurtaa kuusi',
    'Save expense': 'Baasii kuusi',
    'Saving…': 'Kuusaa jira…',
    'Transaction history': 'Seenaa daldalaa',
    'No matching transactions.': 'Daldalli walsimu hin argamne.',
    'Customer profile': 'Odeeffannoo maamilaa',
    'Add Dube customer': 'Maamila liqii dabali',
    'Customer name': 'Maqaa maamilaa',
    Phone: 'Bilbila',
    'Credit limit in ETB': 'Daangaa liqii Birrii',
    'Add customer': 'Maamila dabali',
    'Credit activity': 'Sochii liqii',
    'Record Dube': 'Liqii galmeessi',
    'Credit sale': 'Gurgurtaa liqii',
    Payment: 'Kaffaltii',
    'Save credit sale': 'Gurgurtaa liqii kuusi',
    'Record payment': 'Kaffaltii galmeessi',
    'Outstanding accounts': 'Herrega hin kaffalamne',
    'Dube customers': 'Maamiltoota liqii',
    'Professional documents': 'Sanadoota ogummaa',
    'Receipt centre': 'Wiirtuu nagahee',
    'Ready to issue': 'Baasuuf qophaaʼe',
    'Receipt issued': 'Nagaheen baʼe',
    'Live reporting': 'Gabaasa kallattii',
    'Business performance': 'Raawwii daldalaa',
    'Mark reviewed': 'Akka ilaalametti mallatteessi',
    'Total sales': 'Gurgurtaa waliigalaa',
    'Total expenses': 'Baasii waliigalaa',
    'Positive recorded position': 'Haala gaarii galmaaʼe',
    'Expenses exceed recorded sales': 'Baasiin gurgurtaa galmaaʼe caale',
    'Dube exposure': 'Balaa liqii',
    'Output VAT': 'VAT gurgurtaa',
    'From sales entries': 'Galmee gurgurtaa irraa',
    'Net VAT payable': 'VAT qulqulluu kaffalamu',
    'Business configuration': 'Qindaaʼina daldalaa',
    'Add another business': 'Daldala biraa dabali',
    'Business type': 'Gosa daldalaa',
    Location: 'Bakka',
    'VAT status': 'Haala VAT',
    'VAT registered': 'VAT galmaaʼe',
    Standard: 'Idilee',
    'Receipt prefix': 'Jalqaba lakkoofsa nagahee',
    'Opening balance': 'Haftee jalqabaa',
    'Not added': 'Hin dabalamin',
    Transactions: 'Daldalawwan',
    Customers: 'Maamiltoota',
    'App sections': 'Kutaa appii',
    Settings: 'Qindaaʼina',
    'No results found': 'Buʼaan hin argamne',
    'Try another word or number.': 'Jechoota yookaan lakkoofsa biraa yaali.'
  },
  ti: {
    Dashboard: 'ዳሽቦርድ',
    Ledger: 'መዝገብ',
    Receipts: 'ቅብሊታት',
    Dube: 'ዕዳ',
    Reports: 'ጸብጻባት',
    Operations: 'ምሕደራ',
    Welcome: 'እንቋዕ ብደሓን መጻእኩም',
    Live: 'ቀጥታ',
    Refresh: 'ኣሐድስ',
    Menu: 'ዝርዝር',
    Close: 'ዕጾ',
    'Help Center': 'ማእከል ሓገዝ',
    Search: 'ድለ',
    'Search everything in Biloo Mezgeb': 'ኣብ Biloo Mezgeb ኩሉ ድለ',
    'Search transactions, customers, receipts and settings': 'ግብይታት፣ ዓማዊል፣ ቅብሊታትን ቅንብራትን ድለ',
    Language: 'ቋንቋ',
    Appearance: 'ትርኢት',
    'Light mode': 'ብሩህ ትርኢት',
    'Dark mode': 'ጸሊም ትርኢት',
    'Current business': 'ሕጂ ዘሎ ንግዲ',
    'Net position': 'ጽሩይ ኩነታት',
    Sales: 'ሽያጥ',
    Expenses: 'ወጻኢታት',
    'Outstanding Dube': 'ዘይተኸፍለ ዕዳ',
    'VAT payable': 'ዝኽፈል VAT',
    'Calculated from saved records': 'ካብ ዝተዓቀቡ መዝገባት ዝተሓስበ',
    'VAT not enabled': 'VAT ኣይነቕሐን',
    'Add sale': 'ሽያጥ ወስኽ',
    'Add expense': 'ወጻኢ ወስኽ',
    'Manage Dube': 'ዕዳ ኣመሓድር',
    'Issue receipt': 'ቅብሊት ኣውጽእ',
    'Recent activity': 'ቀረባ ንጥፈት',
    'Live ledger': 'ቀጥታ መዝገብ',
    'View all': 'ኩሉ ርአ',
    'Customer credit': 'ልቓሕ ዓሚል',
    'Dube attention': 'ትኩረት ዝደሊ ዕዳ',
    'Open Dube': 'ዕዳ ክፈት',
    'Business health': 'ጥዕና ንግዲ',
    'Records are syncing': 'መዝገባት ይመሳሰሉ ኣለዉ',
    'Ready for the first record': 'ንመጀመርታ መዝገብ ድሉው',
    'Cross-device data': 'ኣብ መንጎ መሳርሒታት ዳታ',
    Active: 'ንጡፍ',
    'Row Level Security': 'ድሕነት ደረጃ መስርዕ',
    Enforced: 'ተግባራዊ',
    'New protected entry': 'ሓድሽ ዝተሓለወ መዝገብ',
    'Record a transaction': 'ግብይት መዝግብ',
    Sale: 'ሽያጥ',
    Expense: 'ወጻኢ',
    Description: 'መግለጺ',
    'Amount in ETB': 'መጠን ብብር',
    Category: 'ምድብ',
    'Payment method': 'ኣገባብ ክፍሊት',
    Cash: 'ጥረ ገንዘብ',
    Bank: 'ባንኪ',
    'Dube credit': 'ሽያጥ ብዕዳ',
    Other: 'ካልእ',
    'Dube customer': 'ዓሚል ዕዳ',
    'Choose customer': 'ዓሚል ምረጽ',
    'Due date': 'ዕለት ክፍሊት',
    'Amount includes 15% VAT': 'እቲ መጠን 15% VAT የጠቓልል',
    'Save sale': 'ሽያጥ ዓቅብ',
    'Save expense': 'ወጻኢ ዓቅብ',
    'Saving…': 'ይዕቀብ ኣሎ…',
    'Transaction history': 'ታሪኽ ግብይት',
    'No matching transactions.': 'ዝሰማማዕ ግብይት ኣይተረኽበን።',
    'Customer profile': 'መለለዪ ዓሚል',
    'Add Dube customer': 'ዓሚል ዕዳ ወስኽ',
    'Customer name': 'ስም ዓሚል',
    Phone: 'ተሌፎን',
    'Credit limit in ETB': 'ደረት ልቓሕ ብብር',
    'Add customer': 'ዓሚል ወስኽ',
    'Credit activity': 'ንጥፈት ልቓሕ',
    'Record Dube': 'ዕዳ መዝግብ',
    'Credit sale': 'ሽያጥ ብዕዳ',
    Payment: 'ክፍሊት',
    'Save credit sale': 'ሽያጥ ብዕዳ ዓቅብ',
    'Record payment': 'ክፍሊት መዝግብ',
    'Outstanding accounts': 'ዘይተኸፍሉ ሕሳባት',
    'Dube customers': 'ዓማዊል ዕዳ',
    'Professional documents': 'ሞያዊ ሰነዳት',
    'Receipt centre': 'ማእከል ቅብሊት',
    'Ready to issue': 'ንምውጻእ ድሉው',
    'Receipt issued': 'ቅብሊት ወጺኡ',
    'Live reporting': 'ቀጥታ ጸብጻብ',
    'Business performance': 'ኣፈጻጽማ ንግዲ',
    'Mark reviewed': 'ተገምጊሙ ዝብል ምልክት ግበር',
    'Total sales': 'ጠቕላላ ሽያጥ',
    'Total expenses': 'ጠቕላላ ወጻኢ',
    'Positive recorded position': 'ኣወንታዊ ዝተመዝገበ ኩነታት',
    'Expenses exceed recorded sales': 'ወጻኢታት ካብ ዝተመዝገበ ሽያጥ ይበዝሑ',
    'Dube exposure': 'ተጋላጽነት ዕዳ',
    'Output VAT': 'VAT ሽያጥ',
    'From sales entries': 'ካብ መዝገባት ሽያጥ',
    'Net VAT payable': 'ጽሩይ VAT ዝኽፈል',
    'Business configuration': 'ቅንብር ንግዲ',
    'Add another business': 'ካልእ ንግዲ ወስኽ',
    'Business type': 'ዓይነት ንግዲ',
    Location: 'ቦታ',
    'VAT status': 'ኩነታት VAT',
    'VAT registered': 'VAT ዝተመዝገበ',
    Standard: 'ልሙድ',
    'Receipt prefix': 'መጀመርታ ቁጽሪ ቅብሊት',
    'Opening balance': 'መኽፈቲ ቀሪ ሕሳብ',
    'Not added': 'ኣይተወሰኸን',
    Transactions: 'ግብይታት',
    Customers: 'ዓማዊል',
    'App sections': 'ክፍልታት ኣፕ',
    Settings: 'ቅንብራት',
    'No results found': 'ውጽኢት ኣይተረኽበን',
    'Try another word or number.': 'ካልእ ቃል ወይ ቁጽሪ ፈትኑ።'
  },
  so: {
    Dashboard: 'Bogga guud',
    Ledger: 'Diiwaanka',
    Receipts: 'Rasiidhada',
    Dube: 'Deyn',
    Reports: 'Warbixinnada',
    Operations: 'Maamulka',
    Welcome: 'Soo dhawoow',
    Live: 'Toos',
    Refresh: 'Cusboonaysii',
    Menu: 'Liiska',
    Close: 'Xir',
    'Help Center': 'Xarunta Caawinta',
    Search: 'Raadi',
    'Search everything in Biloo Mezgeb': 'Wax kasta ka raadi Biloo Mezgeb',
    'Search transactions, customers, receipts and settings':
      'Raadi macaamil, macaamiil, rasiidho iyo dejin',
    Language: 'Luqad',
    Appearance: 'Muuqaal',
    'Light mode': 'Hab iftiin',
    'Dark mode': 'Hab mugdi',
    'Current business': 'Ganacsiga hadda',
    'Net position': 'Xaaladda saafiga ah',
    Sales: 'Iibka',
    Expenses: 'Kharashaadka',
    'Outstanding Dube': 'Deynta harsan',
    'VAT payable': 'VAT la bixinayo',
    'Calculated from saved records': 'Waxaa laga xisaabiyey diiwaannada la keydiyey',
    'VAT not enabled': 'VAT lama hawlgelin',
    'Add sale': 'Ku dar iib',
    'Add expense': 'Ku dar kharash',
    'Manage Dube': 'Maamul deynta',
    'Issue receipt': 'Soo saar rasiidh',
    'Recent activity': 'Dhaqdhaqaaqii dhowaa',
    'Live ledger': 'Diiwaan toos ah',
    'View all': 'Dhammaan eeg',
    'Customer credit': 'Deynta macmiilka',
    'Dube attention': 'Deyn u baahan fiiro',
    'Open Dube': 'Fur deynta',
    'Business health': 'Caafimaadka ganacsiga',
    'Records are syncing': 'Diiwaannadu way iswaafajinayaan',
    'Ready for the first record': 'Diyaar u ah diiwaanka koowaad',
    'Cross-device data': 'Xogta qalabada kala duwan',
    Active: 'Firfircoon',
    'Row Level Security': 'Amniga heerka safka',
    Enforced: 'La dhaqan geliyey',
    'New protected entry': 'Diiwaan cusub oo la ilaaliyey',
    'Record a transaction': 'Diiwaangeli macaamil',
    Sale: 'Iib',
    Expense: 'Kharash',
    Description: 'Sharaxaad',
    'Amount in ETB': 'Lacagta ETB',
    Category: 'Qayb',
    'Payment method': 'Habka lacag bixinta',
    Cash: 'Lacag caddaan',
    Bank: 'Bangi',
    'Dube credit': 'Iib deyn ah',
    Other: 'Kale',
    'Dube customer': 'Macmiil deyn',
    'Choose customer': 'Dooro macmiil',
    'Due date': 'Taariikhda bixinta',
    'Amount includes 15% VAT': 'Lacagtu waxay ku jirtaa 15% VAT',
    'Save sale': 'Keydi iibka',
    'Save expense': 'Keydi kharashka',
    'Saving…': 'Waa la keydinayaa…',
    'Transaction history': 'Taariikhda macaamilka',
    'No matching transactions.': 'Macaamil la mid ah lama helin.',
    'Customer profile': 'Macluumaadka macmiilka',
    'Add Dube customer': 'Ku dar macmiil deyn',
    'Customer name': 'Magaca macmiilka',
    Phone: 'Telefoon',
    'Credit limit in ETB': 'Xadka deynta ETB',
    'Add customer': 'Ku dar macmiil',
    'Credit activity': 'Dhaqdhaqaaqa deynta',
    'Record Dube': 'Diiwaangeli deyn',
    'Credit sale': 'Iib deyn ah',
    Payment: 'Lacag bixin',
    'Save credit sale': 'Keydi iibka deynta',
    'Record payment': 'Diiwaangeli lacag bixinta',
    'Outstanding accounts': 'Xisaabaadka harsan',
    'Dube customers': 'Macaamiisha deynta',
    'Professional documents': 'Dukumentiyo xirfadeed',
    'Receipt centre': 'Xarunta rasiidhada',
    'Ready to issue': 'Diyaar in la soo saaro',
    'Receipt issued': 'Rasiidh waa la soo saaray',
    'Live reporting': 'Warbixin toos ah',
    'Business performance': 'Waxqabadka ganacsiga',
    'Mark reviewed': 'Calaamadee in la eegay',
    'Total sales': 'Wadarta iibka',
    'Total expenses': 'Wadarta kharashaadka',
    'Positive recorded position': 'Xaalad wanaagsan oo la diiwaangeliyey',
    'Expenses exceed recorded sales': 'Kharashaadku way ka badan yihiin iibka la diiwaangeliyey',
    'Dube exposure': 'Khatarta deynta',
    'Output VAT': 'VAT iibka',
    'From sales entries': 'Diiwaannada iibka',
    'Net VAT payable': 'VAT saafiga ah ee la bixinayo',
    'Business configuration': 'Dejinta ganacsiga',
    'Add another business': 'Ku dar ganacsi kale',
    'Business type': 'Nooca ganacsiga',
    Location: 'Goobta',
    'VAT status': 'Xaaladda VAT',
    'VAT registered': 'VAT diiwaangashan',
    Standard: 'Caadi',
    'Receipt prefix': 'Horgalaha rasiidhka',
    'Opening balance': 'Hadhaaga bilowga',
    'Not added': 'Lama darin',
    Transactions: 'Macaamillada',
    Customers: 'Macaamiisha',
    'App sections': 'Qaybaha app-ka',
    Settings: 'Dejinta',
    'No results found': 'Natiijo lama helin',
    'Try another word or number.': 'Isku day eray ama lambar kale.'
  },
  aa: {
    Dashboard: 'Daashboordi',
    Ledger: 'Galme',
    Receipts: 'Rasiiditte',
    Dube: 'Qada',
    Reports: 'Gabbaaqitte',
    Operations: 'Taamah',
    Welcome: 'Nagay tan',
    Live: 'Namma',
    Refresh: 'Qusbaaci',
    Menu: 'Tanto',
    Close: 'Alfi',
    'Help Center': 'Cato Maktab',
    Search: 'Gorris',
    'Search everything in Biloo Mezgeb': 'Biloo Mezgeb addat inkih gorris',
    'Search transactions, customers, receipts and settings':
      'Tellemmo, macaamiil, rasiiditte kee massoyna gorris',
    Language: 'Afa',
    Appearance: 'Bicitte',
    'Light mode': 'Caxxa le bic',
    'Dark mode': 'Duum le bic',
    'Current business': 'Awayih daddos',
    'Net position': 'Sarra le arac',
    Sales: 'Tellemmo',
    Expenses: 'Gexso',
    'Outstanding Dube': 'Makfax qada',
    'VAT payable': 'Kaffaltam VAT',
    'Calculated from saved records': 'Dacrisim galmeeleh loowimte',
    'VAT not enabled': 'VAT ma abne',
    'Add sale': 'Tellemmo osis',
    'Add expense': 'Gexso osis',
    'Manage Dube': 'Qada massoys',
    'Issue receipt': 'Rasiidi yayyaaqe',
    'Recent activity': 'Xayi uddurih taamah',
    'Live ledger': 'Namma galme',
    'View all': 'Inkih wagit',
    'Customer credit': 'Macaamil qada',
    'Dube attention': 'Wagit faxa qada',
    'Open Dube': 'Qada fan',
    'Business health': 'Daddos qaafiyat',
    'Records are syncing': 'Galmee wal simsiisah yan',
    'Ready for the first record': 'Naharsi galmeeh gulgulus',
    'Cross-device data': 'Maqnatile fanat oyta',
    Active: 'Abah yan',
    'Row Level Security': 'Safah xiqsiisih amaan',
    Enforced: 'Absimte',
    'New protected entry': 'Qusba dacrisim galme',
    'Record a transaction': 'Tellemmo galmees',
    Sale: 'Tellemmo',
    Expense: 'Gexso',
    Description: 'Tascasse',
    'Amount in ETB': 'Lacag ETB',
    Category: 'Rakiibo',
    'Payment method': 'Kaffalti gital',
    Cash: 'Lacag',
    Bank: 'Baanki',
    'Dube credit': 'Qadah tellemmo',
    Other: 'Aka',
    'Dube customer': 'Qada macaamil',
    'Choose customer': 'Macaamil doori',
    'Due date': 'Kaffalti ayro',
    'Amount includes 15% VAT': 'Lacag 15% VAT edde tan',
    'Save sale': 'Tellemmo dacris',
    'Save expense': 'Gexso dacris',
    'Saving…': 'Dacrisah yan…',
    'Transaction history': 'Tellemmo taarik',
    'No matching transactions.': 'Wal gita tellemmo ma geytimne.',
    'Customer profile': 'Macaamil oyta',
    'Add Dube customer': 'Qada macaamil osis',
    'Customer name': 'Macaamil migaq',
    Phone: 'Bilbila',
    'Credit limit in ETB': 'Qada caddo ETB',
    'Add customer': 'Macaamil osis',
    'Credit activity': 'Qada taamah',
    'Record Dube': 'Qada galmees',
    'Credit sale': 'Qadah tellemmo',
    Payment: 'Kaffalti',
    'Save credit sale': 'Qadah tellemmo dacris',
    'Record payment': 'Kaffalti galmees',
    'Outstanding accounts': 'Makfax xisaaba',
    'Dube customers': 'Qada macaamiil',
    'Professional documents': 'Meqem sanado',
    'Receipt centre': 'Rasiidi maktab',
    'Ready to issue': 'Yayyoowuh gulgulus',
    'Receipt issued': 'Rasiidi yawqe',
    'Live reporting': 'Namma gabbaaqa',
    'Business performance': 'Daddos abnisso',
    'Mark reviewed': 'Wagitimeh astaa hayis',
    'Total sales': 'Inkih tellemmo',
    'Total expenses': 'Inkih gexso',
    'Positive recorded position': 'Meqe galme arac',
    'Expenses exceed recorded sales': 'Gexso galme tellemmo dagah tan',
    'Dube exposure': 'Qada qarit',
    'Output VAT': 'Tellemmo VAT',
    'From sales entries': 'Tellemmo galmeeleh',
    'Net VAT payable': 'Sarra VAT kaffaltam',
    'Business configuration': 'Daddos massoyna',
    'Add another business': 'Aka daddos osis',
    'Business type': 'Daddos qaynat',
    Location: 'Arac',
    'VAT status': 'VAT arac',
    'VAT registered': 'VAT galme',
    Standard: 'Madqale',
    'Receipt prefix': 'Rasiidi naharsi asta',
    'Opening balance': 'Qimbis xisaab',
    'Not added': 'Ma osisne',
    Transactions: 'Tellemmo',
    Customers: 'Macaamiil',
    'App sections': 'App exxa',
    Settings: 'Massoyna',
    'No results found': 'Tonnah ma geytimne',
    'Try another word or number.': 'Aka kalima hinnay loow gorris.'
  },
  ar: {
    Dashboard: 'لوحة التحكم',
    Ledger: 'السجل',
    Receipts: 'الإيصالات',
    Dube: 'الديون',
    Reports: 'التقارير',
    Operations: 'الإدارة',
    Welcome: 'مرحبًا',
    Live: 'مباشر',
    Refresh: 'تحديث',
    Menu: 'القائمة',
    Close: 'إغلاق',
    'Help Center': 'مركز المساعدة',
    Search: 'بحث',
    'Search everything in Biloo Mezgeb': 'ابحث عن كل شيء في مزغَب',
    'Search transactions, customers, receipts and settings':
      'ابحث في المعاملات والعملاء والإيصالات والإعدادات',
    Language: 'اللغة',
    Appearance: 'المظهر',
    'Light mode': 'الوضع الفاتح',
    'Dark mode': 'الوضع الداكن',
    'Current business': 'النشاط الحالي',
    'Net position': 'المركز الصافي',
    Sales: 'المبيعات',
    Expenses: 'المصروفات',
    'Outstanding Dube': 'الديون المستحقة',
    'VAT payable': 'ضريبة القيمة المضافة المستحقة',
    'Calculated from saved records': 'محسوبة من السجلات المحفوظة',
    'VAT not enabled': 'ضريبة القيمة المضافة غير مفعلة',
    'Add sale': 'إضافة عملية بيع',
    'Add expense': 'إضافة مصروف',
    'Manage Dube': 'إدارة الديون',
    'Issue receipt': 'إصدار إيصال',
    'Recent activity': 'النشاط الأخير',
    'Live ledger': 'السجل المباشر',
    'View all': 'عرض الكل',
    'Customer credit': 'ائتمان العميل',
    'Dube attention': 'ديون تحتاج إلى متابعة',
    'Open Dube': 'فتح الديون',
    'Business health': 'صحة النشاط',
    'Records are syncing': 'تتم مزامنة السجلات',
    'Ready for the first record': 'جاهز لأول سجل',
    'Cross-device data': 'بيانات عبر الأجهزة',
    Active: 'نشط',
    'Row Level Security': 'أمان مستوى الصفوف',
    Enforced: 'مطبّق',
    'New protected entry': 'قيد جديد محمي',
    'Record a transaction': 'تسجيل معاملة',
    Sale: 'بيع',
    Expense: 'مصروف',
    Description: 'الوصف',
    'Amount in ETB': 'المبلغ بالبير الإثيوبي',
    Category: 'الفئة',
    'Payment method': 'طريقة الدفع',
    Cash: 'نقدًا',
    Bank: 'بنك',
    'Dube credit': 'بيع بالدين',
    Other: 'أخرى',
    'Dube customer': 'عميل مديون',
    'Choose customer': 'اختر العميل',
    'Due date': 'تاريخ الاستحقاق',
    'Amount includes 15% VAT': 'المبلغ يشمل 15% ضريبة قيمة مضافة',
    'Save sale': 'حفظ البيع',
    'Save expense': 'حفظ المصروف',
    'Saving…': 'جارٍ الحفظ…',
    'Transaction history': 'سجل المعاملات',
    'No matching transactions.': 'لا توجد معاملات مطابقة.',
    'Customer profile': 'ملف العميل',
    'Add Dube customer': 'إضافة عميل دين',
    'Customer name': 'اسم العميل',
    Phone: 'الهاتف',
    'Credit limit in ETB': 'حد الائتمان بالبير',
    'Add customer': 'إضافة عميل',
    'Credit activity': 'حركة الائتمان',
    'Record Dube': 'تسجيل دين',
    'Credit sale': 'بيع بالدين',
    Payment: 'دفعة',
    'Save credit sale': 'حفظ البيع بالدين',
    'Record payment': 'تسجيل الدفعة',
    'Outstanding accounts': 'الحسابات المستحقة',
    'Dube customers': 'عملاء الديون',
    'Professional documents': 'مستندات احترافية',
    'Receipt centre': 'مركز الإيصالات',
    'Ready to issue': 'جاهز للإصدار',
    'Receipt issued': 'تم إصدار الإيصال',
    'Live reporting': 'تقارير مباشرة',
    'Business performance': 'أداء النشاط',
    'Mark reviewed': 'وضع علامة تمت المراجعة',
    'Total sales': 'إجمالي المبيعات',
    'Total expenses': 'إجمالي المصروفات',
    'Positive recorded position': 'مركز مسجل إيجابي',
    'Expenses exceed recorded sales': 'المصروفات تتجاوز المبيعات المسجلة',
    'Dube exposure': 'التعرض للديون',
    'Output VAT': 'ضريبة مخرجات المبيعات',
    'From sales entries': 'من قيود المبيعات',
    'Net VAT payable': 'صافي الضريبة المستحقة',
    'Business configuration': 'إعدادات النشاط',
    'Add another business': 'إضافة نشاط آخر',
    'Business type': 'نوع النشاط',
    Location: 'الموقع',
    'VAT status': 'حالة الضريبة',
    'VAT registered': 'مسجل في الضريبة',
    Standard: 'عادي',
    'Receipt prefix': 'بادئة الإيصال',
    'Opening balance': 'الرصيد الافتتاحي',
    'Not added': 'غير مضاف',
    Transactions: 'المعاملات',
    Customers: 'العملاء',
    'App sections': 'أقسام التطبيق',
    Settings: 'الإعدادات',
    'No results found': 'لم يتم العثور على نتائج',
    'Try another word or number.': 'جرّب كلمة أو رقمًا آخر.'
  }
};

const originalText = new WeakMap<Node, string>();
const originalAttributes = new WeakMap<Element, Record<string, string>>();

function translate(locale: Locale, value: string) {
  if (locale === 'en') return value;
  return copy[locale][value] ?? value;
}

function translateDynamic(locale: Locale, value: string) {
  if (locale === 'en') return value;
  const exact = copy[locale][value];
  if (exact) return exact;

  const welcome = value.match(/^Welcome,\s*(.+)$/i);
  if (welcome) return `${translate(locale, 'Welcome')}, ${welcome[1]}`;

  const customerCount = value.match(/^(\d+) customers · (\d+) overdue$/i);
  if (customerCount) {
    const customerWord =
      locale === 'am'
        ? 'ደንበኞች'
        : locale === 'om'
          ? 'maamiltoota'
          : locale === 'ti'
            ? 'ዓማዊል'
            : locale === 'so'
              ? 'macaamiil'
              : locale === 'aa'
                ? 'macaamiil'
                : 'عملاء';
    const overdueWord =
      locale === 'am'
        ? 'ያለፈባቸው'
        : locale === 'om'
          ? 'yeroon isaanii darbe'
          : locale === 'ti'
            ? 'ግዜኦም ዝሓለፈ'
            : locale === 'so'
              ? 'dib u dhacay'
              : locale === 'aa'
                ? 'uddur tatre'
                : 'متأخرون';
    return `${customerCount[1]} ${customerWord} · ${customerCount[2]} ${overdueWord}`;
  }

  const issued = value.match(/^(\d+) issued$/i);
  if (issued) {
    const word =
      locale === 'am'
        ? 'ወጥተዋል'
        : locale === 'om'
          ? 'baʼan'
          : locale === 'ti'
            ? 'ወጺኦም'
            : locale === 'so'
              ? 'la soo saaray'
              : locale === 'aa'
                ? 'yawqe'
                : 'تم إصدارها';
    return `${issued[1]} ${word}`;
  }

  return value;
}

function applyTranslation(root: Element, locale: Locale) {
  let applying = false;
  const run = () => {
    if (applying) return;
    applying = true;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      if (parent && !parent.closest('[data-mobile-controls]') && !parent.closest('script, style')) {
        if (!originalText.has(node)) originalText.set(node, node.textContent ?? '');
        const source = originalText.get(node) ?? '';
        const trimmed = source.trim();
        if (trimmed) {
          const leading = source.match(/^\s*/)?.[0] ?? '';
          const trailing = source.match(/\s*$/)?.[0] ?? '';
          const next = translateDynamic(locale, trimmed);
          if (node.textContent !== `${leading}${next}${trailing}`)
            node.textContent = `${leading}${next}${trailing}`;
        }
      }
      node = walker.nextNode();
    }

    root
      .querySelectorAll<HTMLElement>('input, select, textarea, button, [aria-label], [title]')
      .forEach((element) => {
        if (element.closest('[data-mobile-controls]')) return;
        let attrs = originalAttributes.get(element);
        if (!attrs) {
          attrs = {};
          for (const name of ['placeholder', 'aria-label', 'title']) {
            const value = element.getAttribute(name);
            if (value) attrs[name] = value;
          }
          originalAttributes.set(element, attrs);
        }
        Object.entries(attrs).forEach(([name, value]) => {
          const translated = translateDynamic(locale, value);
          if (element.getAttribute(name) !== translated) element.setAttribute(name, translated);
        });
      });

    root.setAttribute('lang', locale);
    root.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    applying = false;
  };

  run();
  const observer = new MutationObserver(run);
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['placeholder', 'aria-label', 'title']
  });
  return () => observer.disconnect();
}

function formatMoney(value: number) {
  return `ETB ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)}`;
}

function BrandMark() {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label="Biloo Mezgeb logo">
      <defs>
        <linearGradient
          id="mezgeb-mobile-brand"
          x1="7"
          y1="5"
          x2="42"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2D0FA8" />
          <stop offset="1" stopColor="#5B3BF5" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#mezgeb-mobile-brand)" />
      <path
        d="M12.5 33V15.5L24 26.2l11.5-10.7V33"
        fill="none"
        stroke="white"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36.5" cy="11.5" r="3.5" fill="#FFD060" />
    </svg>
  );
}

export function MezgebMobileControls({ userName, activeBusinessId, businesses }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [locale, setLocale] = useState<Locale>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [transactions, setTransactions] = useState<SearchTransaction[]>([]);
  const [customers, setCustomers] = useState<SearchCustomer[]>([]);
  const [receipts, setReceipts] = useState<SearchReceipt[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeBusiness = businesses.find((item) => item.id === activeBusinessId) ?? businesses[0]!;
  const localeInfo = localeOptions.find((item) => item.id === locale) ?? localeOptions[0];
  const t = useCallback((key: string) => translate(locale, key), [locale]);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const savedLocale = window.localStorage.getItem('mezgeb-app-locale') as Locale | null;
      if (savedLocale && localeOptions.some((option) => option.id === savedLocale)) {
        setLocale(savedLocale);
      }

      const savedTheme = window.localStorage.getItem('mezgeb-app-theme') as Theme | null;
      const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      setTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : preferredTheme);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('mezgeb-app-locale', locale);
    const root = document.querySelector('.cloudMezgebApp');
    if (!root) return;
    return applyTranslation(root, locale);
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem('mezgeb-app-theme', theme);
    document.body.dataset.mezgebTheme = theme;
    const root = document.querySelector('.cloudMezgebApp');
    root?.setAttribute('data-mezgeb-theme', theme);
    return () => {
      if (document.body.dataset.mezgebTheme === theme) delete document.body.dataset.mezgebTheme;
    };
  }, [theme]);

  useEffect(() => {
    if (!drawerOpen && !searchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        setSearchOpen(false);
      }
    };
    document.body.classList.add('mezgebMobileOverlayOpen');
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('mezgebMobileOverlayOpen');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [drawerOpen, searchOpen]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setDrawerOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  const activateView = useCallback((view: AppView) => {
    const index = navigation.findIndex((item) => item.id === view);
    const button = document.querySelectorAll<HTMLButtonElement>('.cloudSidebar nav button')[index];
    button?.click();
    setDrawerOpen(false);
    setSearchOpen(false);
    setQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const switchBusiness = useCallback(
    async (businessId: string) => {
      if (!businessId || businessId === activeBusinessId) return;
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user)
        await supabase
          .from('mezgeb_profiles')
          .update({ last_business_id: businessId })
          .eq('id', userData.user.id);
      router.push(`/app?business=${encodeURIComponent(businessId)}`);
      router.refresh();
      setDrawerOpen(false);
    },
    [activeBusinessId, router, supabase]
  );

  const loadSearchData = useCallback(async () => {
    if (searchLoaded || loadingSearch) return;
    setLoadingSearch(true);
    const [transactionResult, customerResult, receiptResult] = await Promise.all([
      supabase
        .from('mezgeb_transactions')
        .select('id, description, amount, payment_method, occurred_at, category, reference, notes')
        .eq('business_id', activeBusinessId)
        .order('occurred_at', { ascending: false })
        .limit(250),
      supabase
        .from('mezgeb_customer_balances')
        .select('id, name, phone, notes, balance, earliest_due_at')
        .eq('business_id', activeBusinessId)
        .order('name', { ascending: true })
        .limit(250),
      supabase
        .from('mezgeb_receipts')
        .select('id, receipt_number, total, issued_at, status')
        .eq('business_id', activeBusinessId)
        .order('issued_at', { ascending: false })
        .limit(150)
    ]);

    setTransactions(
      (transactionResult.data ?? []).map((item) => ({ ...item, amount: Number(item.amount) }))
    );
    setCustomers(
      (customerResult.data ?? []).map((item) => ({ ...item, balance: Number(item.balance) }))
    );
    setReceipts((receiptResult.data ?? []).map((item) => ({ ...item, total: Number(item.total) })));
    setSearchLoaded(true);
    setLoadingSearch(false);
  }, [activeBusinessId, loadingSearch, searchLoaded, supabase]);

  useEffect(() => {
    if (!searchOpen) return;

    const searchTimer = window.setTimeout(() => {
      void loadSearchData();
      inputRef.current?.focus();
    }, 80);

    return () => window.clearTimeout(searchTimer);
  }, [loadSearchData, searchOpen]);

  const searchItems = useMemo<SearchItem[]>(() => {
    const sectionItems: SearchItem[] = navigation.map((item) => ({
      id: `section-${item.id}`,
      view: item.id,
      icon: item.icon,
      title: t(item.label),
      subtitle: t('App sections'),
      keywords: `${item.label} ${t(item.label)} app page screen`,
      type: 'section'
    }));

    const settingItems: SearchItem[] = [
      {
        id: 'setting-language',
        view: 'operations',
        icon: '文',
        title: t('Language'),
        subtitle: localeInfo.label,
        keywords: 'language translate amharic oromo tigrinya somali afar arabic',
        type: 'setting'
      },
      {
        id: 'setting-theme',
        view: 'operations',
        icon: theme === 'dark' ? '☾' : '☀',
        title: t('Appearance'),
        subtitle: t(theme === 'dark' ? 'Dark mode' : 'Light mode'),
        keywords: 'theme appearance light dark night day',
        type: 'setting'
      },
      {
        id: 'setting-business',
        view: 'operations',
        icon: 'M',
        title: activeBusiness.name,
        subtitle: t('Current business'),
        keywords: `${activeBusiness.name} business company workspace ${activeBusiness.city ?? ''} ${activeBusiness.region ?? ''}`,
        type: 'setting'
      }
    ];

    const transactionItems: SearchItem[] = transactions.map((item) => ({
      id: `transaction-${item.id}`,
      view: 'ledger',
      icon: Number(item.amount) >= 0 ? '↕' : '−',
      title: item.description,
      subtitle: `${formatMoney(item.amount)} · ${item.payment_method}`,
      keywords: `${item.description} ${item.amount} ${item.payment_method} ${item.category ?? ''} ${item.reference ?? ''} ${item.notes ?? ''}`,
      type: 'transaction'
    }));

    const customerItems: SearchItem[] = customers.map((item) => ({
      id: `customer-${item.id}`,
      view: 'dube',
      icon: '◎',
      title: item.name,
      subtitle: `${formatMoney(item.balance)}${item.phone ? ` · ${item.phone}` : ''}`,
      keywords: `${item.name} ${item.phone ?? ''} ${item.notes ?? ''} ${item.balance}`,
      type: 'customer'
    }));

    const receiptItems: SearchItem[] = receipts.map((item) => ({
      id: `receipt-${item.id}`,
      view: 'receipts',
      icon: '▤',
      title: item.receipt_number,
      subtitle: `${formatMoney(item.total)} · ${item.status}`,
      keywords: `${item.receipt_number} ${item.total} ${item.status} receipt`,
      type: 'receipt'
    }));

    return [
      ...sectionItems,
      ...settingItems,
      ...transactionItems,
      ...customerItems,
      ...receiptItems
    ];
  }, [activeBusiness, customers, localeInfo.label, receipts, t, theme, transactions]);

  const filteredSearchItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized)
      return searchItems
        .filter((item) => item.type === 'section' || item.type === 'setting')
        .slice(0, 12);
    const terms = normalized.split(/\s+/).filter(Boolean);
    return searchItems
      .map((item) => {
        const haystack = `${item.title} ${item.subtitle} ${item.keywords}`.toLocaleLowerCase();
        const score = terms.reduce(
          (total, term) =>
            total +
            (haystack.includes(term) ? 2 : 0) +
            (item.title.toLocaleLowerCase().startsWith(term) ? 3 : 0),
          0
        );
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map(({ item }) => item);
  }, [query, searchItems]);

  const selectSearchItem = (item: SearchItem) => {
    if (item.id === 'setting-language') {
      setSearchOpen(false);
      setDrawerOpen(true);
      window.setTimeout(() => document.getElementById('mezgeb-mobile-language')?.focus(), 100);
      return;
    }
    if (item.id === 'setting-theme') {
      setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
      return;
    }
    activateView(item.view);
  };

  return (
    <div className="mezgebMobileControls" data-mobile-controls data-dir={localeInfo.dir}>
      <header className="mezgebMobileHeader">
        <button
          className="mezgebMobileBrand"
          type="button"
          onClick={() => activateView('dashboard')}
          aria-label="Open dashboard"
        >
          <BrandMark />
          <span>
            <strong>Biloo Mezgeb</strong>
            <small>{activeBusiness.name}</small>
          </span>
        </button>
        <div className="mezgebMobileHeaderActions">
          <button
            type="button"
            className="mezgebMobileUtility"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            aria-label={t(theme === 'dark' ? 'Light mode' : 'Dark mode')}
            title={t(theme === 'dark' ? 'Light mode' : 'Dark mode')}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button
            type="button"
            className="mezgebMobileLanguageShortcut"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('Language')}
          >
            {localeInfo.short}
          </button>
          <button
            type="button"
            className="mezgebMobileMenuButton"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('Menu')}
            aria-expanded={drawerOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className="mezgebMobileSearchBar">
        <span aria-hidden="true">⌕</span>
        <button type="button" onClick={() => setSearchOpen(true)}>
          {t('Search everything in Biloo Mezgeb')}
        </button>
        <kbd>⌘ K</kbd>
      </div>

      {drawerOpen ? (
        <>
          <button
            className="mezgebMobileBackdrop"
            type="button"
            aria-label={t('Close')}
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="mezgebMobileDrawer" aria-label={t('Menu')}>
            <header>
              <div className="mezgebDrawerBrand">
                <BrandMark />
                <div>
                  <strong>Biloo Mezgeb</strong>
                  <small>
                    {t('Welcome')}, {userName}
                  </small>
                </div>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label={t('Close')}>
                ×
              </button>
            </header>

            <label className="mezgebDrawerBusiness">
              <span>{t('Current business')}</span>
              <select
                value={activeBusinessId}
                onChange={(event) => void switchBusiness(event.target.value)}
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <small>
                {activeBusiness.city || activeBusiness.region || 'Ethiopia'} ·{' '}
                {activeBusiness.vatRegistered ? t('VAT registered') : t('Standard')}
              </small>
            </label>

            <nav className="mezgebDrawerNavigation" aria-label="Mobile app navigation">
              {navigation.map((item) => (
                <button type="button" key={item.id} onClick={() => activateView(item.id)}>
                  <i>{item.icon}</i>
                  <span>{t(item.label)}</span>
                  <b>›</b>
                </button>
              ))}
            </nav>

            <section className="mezgebDrawerSettings">
              <label htmlFor="mezgeb-mobile-language">
                <span>
                  <i>文</i>
                  {t('Language')}
                </span>
                <select
                  id="mezgeb-mobile-language"
                  value={locale}
                  onChange={(event) => setLocale(event.target.value as Locale)}
                >
                  {localeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              >
                <span>
                  <i>{theme === 'dark' ? '☾' : '☀'}</i>
                  {t('Appearance')}
                </span>
                <b>{t(theme === 'dark' ? 'Dark mode' : 'Light mode')}</b>
              </button>
              <a href="/help">
                <span>
                  <i>?</i>
                  {t('Help Center')}
                </span>
                <b>›</b>
              </a>
            </section>

            <footer>
              <span className="syncDot" />
              Supabase sync active
            </footer>
          </aside>
        </>
      ) : null}

      {searchOpen ? (
        <>
          <button
            className="mezgebSearchBackdrop"
            type="button"
            aria-label={t('Close')}
            onClick={() => setSearchOpen(false)}
          />
          <section
            className="mezgebGlobalSearch"
            role="dialog"
            aria-modal="true"
            aria-label={t('Search')}
          >
            <header>
              <span>⌕</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('Search transactions, customers, receipts and settings')}
                aria-label={t('Search')}
              />
              <button type="button" onClick={() => setSearchOpen(false)}>
                {t('Close')}
              </button>
            </header>
            <div className="mezgebSearchResults" aria-live="polite">
              {loadingSearch ? (
                <div className="mezgebSearchLoading">
                  <span />
                  <p>{t('Search')}…</p>
                </div>
              ) : null}
              {!loadingSearch &&
                filteredSearchItems.map((item) => (
                  <button type="button" key={item.id} onClick={() => selectSearchItem(item)}>
                    <i>{item.icon}</i>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </span>
                    <b>›</b>
                  </button>
                ))}
              {!loadingSearch && filteredSearchItems.length === 0 ? (
                <div className="mezgebSearchEmpty">
                  <i>⌕</i>
                  <strong>{t('No results found')}</strong>
                  <p>{t('Try another word or number.')}</p>
                </div>
              ) : null}
            </div>
            <footer>
              <span>
                {searchLoaded
                  ? `${transactions.length + customers.length + receipts.length} indexed records`
                  : 'Secure workspace search'}
              </span>
              <span>Esc · {t('Close')}</span>
            </footer>
          </section>
        </>
      ) : null}
    </div>
  );
}
