import {Routes} from '@angular/router';
import {FeeTypeList} from './pages/fee-type-list/fee-type-list';
import {FeePlanList} from './pages/fee-plan-list/fee-plan-list';
import {InvoiceList} from './pages/invoice-list/invoice-list';

export const feesRoutes: Routes = [
  { path: 'types', component: FeeTypeList },
  { path: 'plans', component: FeePlanList },
  { path: 'invoices', component: InvoiceList },
  { path: '', redirectTo: 'invoices', pathMatch: 'full' },
];
