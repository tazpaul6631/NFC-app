import type { App } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Checkbox from 'primevue/checkbox'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import Drawer from 'primevue/drawer'
import Menubar from 'primevue/menubar'
import Breadcrumb from 'primevue/breadcrumb'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tooltip from 'primevue/tooltip'
import Ripple from 'primevue/ripple'

export default {
  install(app: App) {
    app.component('Button', Button)
    app.component('InputText', InputText)
    app.component('Password', Password)
    app.component('DataTable', DataTable)
    app.component('Column', Column)
    app.component('Select', Select)
    app.component('MultiSelect', MultiSelect)
    app.component('Checkbox', Checkbox)
    app.component('DatePicker', DatePicker)
    app.component('Tag', Tag)
    app.component('Avatar', Avatar)
    app.component('Menu', Menu)
    app.component('Drawer', Drawer)
    app.component('Menubar', Menubar)
    app.component('Breadcrumb', Breadcrumb)
    app.component('Card', Card)
    app.component('Divider', Divider)
    app.component('IconField', IconField)
    app.component('InputIcon', InputIcon)
    app.directive('tooltip', Tooltip)
    app.directive('ripple', Ripple)
  },
}
