import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
const resources = {
  en: {
    translation: {
      common: {
        save: 'Save Changes',
        cancel: 'Cancel',
        loading: 'Loading...',
        uploading: 'Uploading...'
      },
      settings: {
        organizationSettings: 'Organization Settings',
        language: 'Language',
        selectLanguage: 'Select your language',
        companyName: 'Company Name',
        trade: 'Trade',
        selectTrade: 'Select your trade',
        contactName: 'Contact Name',
        telephone: 'Telephone',
        cellPhone: 'Cell Phone',
        businessEmail: 'Business Email',
        certificationName: 'Certification Name',
        certificationPlaceholder: 'e.g. Professional Constructor Certification',
        companyLogo: 'Company Logo',
        uploadLogo: 'Click to upload logo',
        minorityOwned: 'Minority-Owned Business',
        minorityGroup: 'Minority Group',
        selectMinorityGroup: 'Select minority group',
        dangerZone: 'Danger Zone',
        deactivateAccount: 'Deactivate Account',
        deleteAccount: 'Delete Account',
        areYouSure: 'Are you sure?',
        areYouAbsolutelySure: 'Are you absolutely sure?',
        deactivateWarning: 'Your account will be deactivated and you won\'t be able to access it until you contact support to reactivate it.',
        deleteWarning: 'This action cannot be undone. This will permanently delete your account and remove all your data from our servers.'
      }
    }
  },
  es: {
    translation: {
      common: {
        save: 'Guardar Cambios',
        cancel: 'Cancelar',
        loading: 'Cargando...',
        uploading: 'Subiendo...'
      },
      settings: {
        organizationSettings: 'Configuración de la Organización',
        language: 'Idioma',
        selectLanguage: 'Seleccione su idioma',
        companyName: 'Nombre de la Empresa',
        trade: 'Oficio',
        selectTrade: 'Seleccione su oficio',
        contactName: 'Nombre de Contacto',
        telephone: 'Teléfono',
        cellPhone: 'Teléfono Móvil',
        businessEmail: 'Correo Electrónico de Negocios',
        certificationName: 'Nombre de Certificación',
        certificationPlaceholder: 'ej. Certificación Profesional de Constructor',
        companyLogo: 'Logo de la Empresa',
        uploadLogo: 'Haga clic para subir logo',
        minorityOwned: 'Empresa Propiedad de Minoría',
        minorityGroup: 'Grupo Minoritario',
        selectMinorityGroup: 'Seleccione grupo minoritario',
        dangerZone: 'Zona de Peligro',
        deactivateAccount: 'Desactivar Cuenta',
        deleteAccount: 'Eliminar Cuenta',
        areYouSure: '¿Está seguro?',
        areYouAbsolutelySure: '¿Está absolutamente seguro?',
        deactivateWarning: 'Su cuenta será desactivada y no podrá acceder a ella hasta que contacte con soporte para reactivarla.',
        deleteWarning: 'Esta acción no se puede deshacer. Eliminará permanentemente su cuenta y eliminará todos sus datos de nuestros servidores.'
      }
    }
  },
  fr: {
    translation: {
      common: {
        save: 'Enregistrer les Modifications',
        cancel: 'Annuler',
        loading: 'Chargement...',
        uploading: 'Téléchargement...'
      },
      settings: {
        organizationSettings: 'Paramètres de l\'Organisation',
        language: 'Langue',
        selectLanguage: 'Sélectionnez votre langue',
        companyName: 'Nom de l\'Entreprise',
        trade: 'Métier',
        selectTrade: 'Sélectionnez votre métier',
        contactName: 'Nom du Contact',
        telephone: 'Téléphone',
        cellPhone: 'Téléphone Mobile',
        businessEmail: 'Email Professionnel',
        certificationName: 'Nom de la Certification',
        certificationPlaceholder: 'ex. Certification Professionnelle de Constructeur',
        companyLogo: 'Logo de l\'Entreprise',
        uploadLogo: 'Cliquez pour télécharger le logo',
        minorityOwned: 'Entreprise Appartenant à une Minorité',
        minorityGroup: 'Groupe Minoritaire',
        selectMinorityGroup: 'Sélectionnez un groupe minoritaire',
        dangerZone: 'Zone Dangereuse',
        deactivateAccount: 'Désactiver le Compte',
        deleteAccount: 'Supprimer le Compte',
        areYouSure: 'Êtes-vous sûr?',
        areYouAbsolutelySure: 'Êtes-vous absolument sûr?',
        deactivateWarning: 'Votre compte sera désactivé et vous ne pourrez pas y accéder jusqu\'à ce que vous contactiez le support pour le réactiver.',
        deleteWarning: 'Cette action ne peut pas être annulée. Elle supprimera définitivement votre compte et toutes vos données de nos serveurs.'
      }
    }
  },
  de: {
    translation: {
      common: {
        save: 'Änderungen Speichern',
        cancel: 'Abbrechen',
        loading: 'Wird geladen...',
        uploading: 'Wird hochgeladen...'
      },
      settings: {
        organizationSettings: 'Organisationseinstellungen',
        language: 'Sprache',
        selectLanguage: 'Wählen Sie Ihre Sprache',
        companyName: 'Firmenname',
        trade: 'Gewerbe',
        selectTrade: 'Wählen Sie Ihr Gewerbe',
        contactName: 'Kontaktname',
        telephone: 'Telefon',
        cellPhone: 'Mobiltelefon',
        businessEmail: 'Geschäfts-E-Mail',
        certificationName: 'Zertifizierungsname',
        certificationPlaceholder: 'z.B. Professionelle Konstrukteurzertifizierung',
        companyLogo: 'Firmenlogo',
        uploadLogo: 'Klicken Sie, um Logo hochzuladen',
        minorityOwned: 'Unternehmen in Besitz von Minderheiten',
        minorityGroup: 'Minderheitsgruppe',
        selectMinorityGroup: 'Minderheitsgruppe auswählen',
        dangerZone: 'Gefahrenzone',
        deactivateAccount: 'Konto deaktivieren',
        deleteAccount: 'Konto löschen',
        areYouSure: 'Sind Sie sicher?',
        areYouAbsolutelySure: 'Sind Sie absolut sicher?',
        deactivateWarning: 'Ihr Konto wird deaktiviert und Sie können nicht darauf zugreifen, bis Sie den Support kontaktieren, um es zu reaktivieren.',
        deleteWarning: 'Diese Aktion kann nicht rückgängig gemacht werden. Sie löscht Ihr Konto dauerhaft und entfernt alle Ihre Daten von unseren Servern.'
      }
    }
  },
  ja: {
    translation: {
      common: {
        save: '変更を保存',
        cancel: 'キャンセル',
        loading: '読み込み中...',
        uploading: 'アップロード中...'
      },
      settings: {
        organizationSettings: '組織設定',
        language: '言語',
        selectLanguage: '言語を選択',
        companyName: '会社名',
        trade: '業種',
        selectTrade: '業種を選択',
        contactName: '担当者名',
        telephone: '電話番号',
        cellPhone: '携帯電話',
        businessEmail: 'ビジネスメール',
        certificationName: '認証名',
        certificationPlaceholder: '例: プロフェッショナル建設業者認証',
        companyLogo: '会社ロゴ',
        uploadLogo: 'クリックしてロゴをアップロード',
        minorityOwned: 'マイノリティ所有企業',
        minorityGroup: 'マイノリティグループ',
        selectMinorityGroup: 'マイノリティグループを選択',
        dangerZone: '危険ゾーン',
        deactivateAccount: 'アカウントを無効化',
        deleteAccount: 'アカウントを削除',
        areYouSure: '本当によろしいですか？',
        areYouAbsolutelySure: '絶対に確信していますか？',
        deactivateWarning: 'アカウントは無効化され、サポートに連絡して再有効化するまでアクセスできなくなります。',
        deleteWarning: 'この操作は元に戻せません。アカウントが完全に削除され、すべてのデータが当社のサーバーから削除されます。'
      }
    }
  },
  zh: {
    translation: {
      common: {
        save: '保存更改',
        cancel: '取消',
        loading: '加载中...',
        uploading: '上传中...'
      },
      settings: {
        organizationSettings: '组织设置',
        language: '语言',
        selectLanguage: '选择您的语言',
        companyName: '公司名称',
        trade: '行业',
        selectTrade: '选择您的行业',
        contactName: '联系人姓名',
        telephone: '电话',
        cellPhone: '手机',
        businessEmail: '商务邮箱',
        certificationName: '认证名称',
        certificationPlaceholder: '例如：专业建筑师认证',
        companyLogo: '公司标志',
        uploadLogo: '点击上传标志',
        minorityOwned: '少数族裔拥有的企业',
        minorityGroup: '少数族裔群体',
        selectMinorityGroup: '选择少数族裔群体',
        dangerZone: '危险区域',
        deactivateAccount: '停用账户',
        deleteAccount: '删除账户',
        areYouSure: '您确定吗？',
        areYouAbsolutelySure: '您绝对确定吗？',
        deactivateWarning: '您的账户将被停用，您将无法访问它，直到您联系支持以重新激活它。',
        deleteWarning: '此操作无法撤销。这将永久删除您的账户并从我们的服务器上删除所有数据。'
      }
    }
  }
};

// Configure i18next
i18n
  .use(LanguageDetector) // Detect language automatically
  .use(initReactI18next) // Pass i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language
    debug: import.meta.env.DEV, // Enable debug in development
    
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    
    // Language detector options
    detection: {
      // Order and from where user language should be detected
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      
      // Keys or params to lookup language from
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      
      // Cache user language in localStorage and cookie
      caches: ['localStorage', 'cookie'],
      
      // Cookie options for language detection
      cookieMinutes: 2 * 365 * 24 * 60, // 2 years
    }
  });

export default i18n;