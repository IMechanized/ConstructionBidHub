import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const enTranslations = {
  common: {
    save: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    loading: 'Loading...',
    uploading: 'Uploading...',
  },
  navigation: {
    dashboard: 'Dashboard',
    rfps: 'RFPs',
    employees: 'Employees',
    settings: 'Settings',
    support: 'Support',
    logout: 'Logout',
  },
  settings: {
    title: 'Account Settings',
    organizationSettings: 'Organization Settings',
    companyName: 'Company Name',
    contact: 'Contact Name',
    telephone: 'Telephone',
    cell: 'Cell Phone',
    businessEmail: 'Business Email',
    trade: 'Trade',
    certificationName: 'Certification Name',
    logo: 'Company Logo',
    uploadLogo: 'Click to upload logo',
    language: 'Language',
    selectLanguage: 'Select your language',
    minorityOwned: 'Minority-Owned Business',
    minorityGroup: 'Minority Group',
    selectMinorityGroup: 'Select minority group',
    dangerZone: 'Danger Zone',
    deactivateAccount: 'Deactivate Account',
    deleteAccount: 'Delete Account',
  },
  alerts: {
    settingsUpdated: 'Settings Updated',
    settingsUpdateSuccess: 'Your organization settings have been updated successfully',
    error: 'Error',
    accountDeactivated: 'Account Deactivated',
    accountDeactivatedMessage: 'Your account has been deactivated. You will be logged out.',
    accountDeleted: 'Account Deleted',
    accountDeletedMessage: 'Your account has been permanently deleted. You will be logged out.',
    confirmDeactivate: 'Are you sure?',
    confirmDeactivateMessage: 'Your account will be deactivated and you won\'t be able to access it until you contact support to reactivate it.',
    confirmDelete: 'Are you absolutely sure?',
    confirmDeleteMessage: 'This action cannot be undone. This will permanently delete your account and remove all your data from our servers.',
  },
};

// Spanish translations
const esTranslations = {
  common: {
    save: 'Guardar Cambios',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    loading: 'Cargando...',
    uploading: 'Subiendo...',
  },
  navigation: {
    dashboard: 'Panel',
    rfps: 'RFPs',
    employees: 'Empleados',
    settings: 'Configuración',
    support: 'Soporte',
    logout: 'Cerrar Sesión',
  },
  settings: {
    title: 'Configuración de la Cuenta',
    organizationSettings: 'Configuración de la Organización',
    companyName: 'Nombre de la Empresa',
    contact: 'Nombre de Contacto',
    telephone: 'Teléfono',
    cell: 'Teléfono Móvil',
    businessEmail: 'Correo Electrónico Empresarial',
    trade: 'Profesión',
    certificationName: 'Nombre de Certificación',
    logo: 'Logo de la Empresa',
    uploadLogo: 'Haga clic para cargar el logo',
    language: 'Idioma',
    selectLanguage: 'Seleccione su idioma',
    minorityOwned: 'Empresa de Propiedad Minoritaria',
    minorityGroup: 'Grupo Minoritario',
    selectMinorityGroup: 'Seleccione grupo minoritario',
    dangerZone: 'Zona de Peligro',
    deactivateAccount: 'Desactivar Cuenta',
    deleteAccount: 'Eliminar Cuenta',
  },
  alerts: {
    settingsUpdated: 'Configuración Actualizada',
    settingsUpdateSuccess: 'La configuración de su organización ha sido actualizada con éxito',
    error: 'Error',
    accountDeactivated: 'Cuenta Desactivada',
    accountDeactivatedMessage: 'Su cuenta ha sido desactivada. Se cerrará su sesión.',
    accountDeleted: 'Cuenta Eliminada',
    accountDeletedMessage: 'Su cuenta ha sido eliminada permanentemente. Se cerrará su sesión.',
    confirmDeactivate: '¿Está seguro?',
    confirmDeactivateMessage: 'Su cuenta será desactivada y no podrá acceder a ella hasta que contacte con soporte para reactivarla.',
    confirmDelete: '¿Está completamente seguro?',
    confirmDeleteMessage: 'Esta acción no se puede deshacer. Esto eliminará permanentemente su cuenta y todos sus datos de nuestros servidores.',
  },
};

// Initialize i18next
i18n
  .use(LanguageDetector)  // Automatically detect language from browser
  .use(initReactI18next)  // Initialize React bindings
  .init({
    resources: {
      en: enTranslations,
      es: esTranslations,
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,  // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;