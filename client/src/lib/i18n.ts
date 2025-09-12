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
        uploading: 'Uploading...',
        appName: 'FindConstructionBids',
        error: 'Error',
        submitting: 'Submitting...'
      },
      validation: {
        titleRequired: 'Title is required',
        descriptionRequired: 'Description is required',
        jobStreetRequired: 'Street address is required',
        jobCityRequired: 'City is required',
        jobStateRequired: 'State is required',
        jobZipRequired: 'ZIP code is required',
        walkthroughDateRequired: 'Walkthrough date is required',
        rfiDateRequired: 'RFI date is required',
        deadlineRequired: 'Deadline is required',
        validEmail: 'Please enter a valid email address',
        messageRequired: 'Please enter your question or message'
      },
      auth: {
        login: 'Login',
        logout: 'Logout',
        register: 'Register',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot password?',
        rememberMe: 'Remember me',
        noAccount: 'Don\'t have an account?',
        haveAccount: 'Already have an account?',
        createAccount: 'Create an account',
        loginError: 'Invalid email or password'
      },
      dashboard: {
        dashboard: 'Dashboard',
        myRfps: 'My RFPs',
        createRfp: 'Create RFP',
        createNewRfp: 'Create New RFP',
        searchRfps: 'Search RFPs...',
        sortBy: 'Sort by...',
        filterByLocation: 'Filter by location',
        allLocations: 'All Locations',
        sortOptions: {
          priceLowHigh: 'RFP Amount: Low to High',
          priceHighLow: 'RFP Amount: High to Low',
          deadline: 'Deadline'
        }
      },
      sidebar: {
        myRfps: 'My RFPs',
        featuredRfps: 'Featured RFPs',
        newRfps: 'New RFPs',
        allRfps: 'All RFPs',
        myRfis: 'My RFIs',
        reports: 'Reports',
        analytics: 'Analytics',
        employees: 'Employees',
        settings: 'Settings',
        support: 'Support'
      },
      settings: {
        organizationSettings: 'Organization Settings',
        language: 'Language',
        languageDescription: 'Choose your preferred display language',
        languageUpdated: 'Language Updated',
        languageUpdateSuccess: 'Your language preference has been updated successfully',
        languageUpdateError: 'Failed to update language preference',
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
      },
      rfp: {
        title: 'Project Title',
        enterTitle: 'Enter RFP title',
        description: 'Project Description',
        enterDescription: 'Enter RFP description',
        walkthroughDate: 'Walkthrough Date',
        rfiDate: 'RFI Date',
        deadline: 'Bid Deadline',
        minimumBudget: 'Minimum Budget',
        enterMinimumBudget: 'Enter minimum budget',
        jobAddress: 'Job Address',
        streetAddress: 'Street Address',
        enterStreetAddress: 'Enter street address',
        city: 'City',
        enterCity: 'Enter city',
        state: 'State',
        selectState: 'Select state',
        zipCode: 'ZIP Code',
        enterZipCode: 'Enter ZIP code',
        certificationGoals: 'Certification Requirements',
        selectCertificationGoals: 'Select certification requirements',
        certificationGoalsDescription: 'Select one or more certification requirements for this project',
        portfolioLink: 'Portfolio Link',
        submitRfp: 'Submit RFP',
        creating: 'Creating...',
        boosting: 'Boosting...',
        boostVisibility: 'Boost for Visibility',
        rfpCreated: 'RFP Created',
        rfpCreatedSuccess: 'Your RFP has been successfully created'
      },
      rfi: {
        emailAddress: 'Email Address',
        enterEmail: 'Enter your email address',
        questionMessage: 'Question/Message',
        enterQuestion: 'Enter your questions or request for additional information...',
        submitRequest: 'Submit Request',
        requestSent: 'Request Sent',
        requestSuccessful: 'Your request for information has been submitted successfully'
      }
    }
  },
  es: {
    translation: {
      common: {
        save: 'Guardar Cambios',
        cancel: 'Cancelar',
        loading: 'Cargando...',
        uploading: 'Subiendo...',
        submitting: 'Enviando...',
        appName: 'FindConstructionBids',
        error: 'Error'
      },
      validation: {
        titleRequired: 'El título es obligatorio',
        descriptionRequired: 'La descripción es obligatoria',
        jobStreetRequired: 'La dirección es obligatoria',
        jobCityRequired: 'La ciudad es obligatoria',
        jobStateRequired: 'El estado es obligatorio',
        jobZipRequired: 'El código postal es obligatorio',
        walkthroughDateRequired: 'La fecha de visita es obligatoria',
        rfiDateRequired: 'La fecha de RFI es obligatoria',
        deadlineRequired: 'La fecha límite es obligatoria',
        validEmail: 'Por favor, introduzca una dirección de correo electrónico válida',
        messageRequired: 'Por favor, introduzca su pregunta o mensaje'
      },
      auth: {
        login: 'Iniciar Sesión',
        logout: 'Cerrar Sesión',
        register: 'Registrarse',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        forgotPassword: '¿Olvidó su contraseña?',
        rememberMe: 'Recuérdame',
        noAccount: '¿No tiene una cuenta?',
        haveAccount: '¿Ya tiene una cuenta?',
        createAccount: 'Crear una cuenta',
        loginError: 'Correo electrónico o contraseña incorrectos'
      },
      dashboard: {
        dashboard: 'Panel',
        myRfps: 'Mis RFPs',
        createRfp: 'Crear RFP',
        createNewRfp: 'Crear Nuevo RFP',
        searchRfps: 'Buscar RFPs...',
        sortBy: 'Ordenar por...',
        filterByLocation: 'Filtrar por ubicación',
        allLocations: 'Todas las Ubicaciones',
        sortOptions: {
          priceLowHigh: 'Cantidad RFP: Bajo a Alto',
          priceHighLow: 'Cantidad RFP: Alto a Bajo',
          deadline: 'Fecha Límite'
        }
      },
      sidebar: {
        myRfps: 'Mis RFPs',
        featuredRfps: 'RFPs Destacados',
        newRfps: 'Nuevos RFPs',
        allRfps: 'Todos los RFPs',
        myRfis: 'Mis RFIs',
        reports: 'Informes',
        analytics: 'Analíticas',
        employees: 'Empleados',
        settings: 'Configuración',
        support: 'Soporte'
      },
      settings: {
        organizationSettings: 'Configuración de la Organización',
        language: 'Idioma',
        languageDescription: 'Elija su idioma de visualización preferido',
        languageUpdated: 'Idioma Actualizado',
        languageUpdateSuccess: 'Su preferencia de idioma ha sido actualizada con éxito',
        languageUpdateError: 'No se pudo actualizar la preferencia de idioma',
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
      },
      rfi: {
        emailAddress: 'Dirección de Correo Electrónico',
        enterEmail: 'Introduzca su dirección de correo electrónico',
        questionMessage: 'Pregunta/Mensaje',
        enterQuestion: 'Introduzca sus preguntas o solicitud de información adicional...',
        submitRequest: 'Enviar Solicitud',
        requestSent: 'Solicitud Enviada',
        requestSuccessful: 'Su solicitud de información ha sido enviada con éxito'
      }
    }
  },
  fr: {
    translation: {
      common: {
        save: 'Enregistrer les Modifications',
        cancel: 'Annuler',
        loading: 'Chargement...',
        uploading: 'Téléchargement...',
        submitting: 'Soumission...',
        appName: 'FindConstructionBids',
        error: 'Erreur'
      },
      validation: {
        titleRequired: 'Le titre est requis',
        descriptionRequired: 'La description est requise',
        jobLocationRequired: 'L\'emplacement du travail est requis',
        walkthroughDateRequired: 'La date de visite est requise',
        rfiDateRequired: 'La date de RFI est requise',
        deadlineRequired: 'La date limite est requise',
        validEmail: 'Veuillez entrer une adresse e-mail valide',
        messageRequired: 'Veuillez entrer votre question ou message'
      },
      auth: {
        login: 'Connexion',
        logout: 'Déconnexion',
        register: 'S\'inscrire',
        email: 'Email',
        password: 'Mot de passe',
        forgotPassword: 'Mot de passe oublié?',
        rememberMe: 'Se souvenir de moi',
        noAccount: 'Vous n\'avez pas de compte?',
        haveAccount: 'Vous avez déjà un compte?',
        createAccount: 'Créer un compte',
        loginError: 'Email ou mot de passe invalide'
      },
      dashboard: {
        dashboard: 'Tableau de Bord',
        myRfps: 'Mes RFPs',
        createRfp: 'Créer RFP',
        createNewRfp: 'Créer Nouveau RFP',
        searchRfps: 'Rechercher RFPs...',
        sortBy: 'Trier par...',
        filterByLocation: 'Filtrer par lieu',
        allLocations: 'Tous les Lieux',
        sortOptions: {
          priceLowHigh: 'Montant RFP: Bas à Élevé',
          priceHighLow: 'Montant RFP: Élevé à Bas',
          deadline: 'Date Limite'
        }
      },
      sidebar: {
        myRfps: 'Mes RFPs',
        featuredRfps: 'RFPs en Vedette',
        newRfps: 'Nouveaux RFPs',
        allRfps: 'Tous les RFPs',
        myRfis: 'Mes RFIs',
        reports: 'Rapports',
        analytics: 'Analytiques',
        employees: 'Employés',
        settings: 'Paramètres',
        support: 'Support'
      },
      settings: {
        organizationSettings: 'Paramètres de l\'Organisation',
        language: 'Langue',
        languageDescription: 'Choisissez votre langue d\'affichage préférée',
        languageUpdated: 'Langue Mise à Jour',
        languageUpdateSuccess: 'Votre préférence de langue a été mise à jour avec succès',
        languageUpdateError: 'Échec de la mise à jour de la préférence de langue',
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
      },
      rfi: {
        emailAddress: 'Adresse Email',
        enterEmail: 'Entrez votre adresse email',
        questionMessage: 'Question/Message',
        enterQuestion: 'Entrez vos questions ou demande d\'informations supplémentaires...',
        submitRequest: 'Soumettre la Demande',
        requestSent: 'Demande Envoyée',
        requestSuccessful: 'Votre demande d\'information a été soumise avec succès'
      }
    }
  },
  de: {
    translation: {
      common: {
        save: 'Änderungen Speichern',
        cancel: 'Abbrechen',
        loading: 'Wird geladen...',
        uploading: 'Wird hochgeladen...',
        submitting: 'Wird übermittelt...',
        appName: 'FindConstructionBids',
        error: 'Fehler'
      },
      validation: {
        titleRequired: 'Titel ist erforderlich',
        descriptionRequired: 'Beschreibung ist erforderlich',
        jobLocationRequired: 'Arbeitsort ist erforderlich',
        walkthroughDateRequired: 'Begehungsdatum ist erforderlich',
        rfiDateRequired: 'RFI-Datum ist erforderlich',
        deadlineRequired: 'Frist ist erforderlich',
        validEmail: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        messageRequired: 'Bitte geben Sie Ihre Frage oder Nachricht ein'
      },
      auth: {
        login: 'Anmelden',
        logout: 'Abmelden',
        register: 'Registrieren',
        email: 'E-Mail',
        password: 'Passwort',
        forgotPassword: 'Passwort vergessen?',
        rememberMe: 'Angemeldet bleiben',
        noAccount: 'Noch kein Konto?',
        haveAccount: 'Bereits ein Konto?',
        createAccount: 'Konto erstellen',
        loginError: 'Ungültige E-Mail oder Passwort'
      },
      dashboard: {
        dashboard: 'Dashboard',
        myRfps: 'Meine RFPs',
        createRfp: 'RFP erstellen',
        createNewRfp: 'Neues RFP erstellen',
        searchRfps: 'RFPs suchen...',
        sortBy: 'Sortieren nach...',
        filterByLocation: 'Nach Standort filtern',
        allLocations: 'Alle Standorte',
        sortOptions: {
          priceLowHigh: 'RFP-Betrag: Niedrig zu Hoch',
          priceHighLow: 'RFP-Betrag: Hoch zu Niedrig',
          deadline: 'Frist'
        }
      },
      sidebar: {
        myRfps: 'Meine RFPs',
        featuredRfps: 'Ausgewählte RFPs',
        newRfps: 'Neue RFPs',
        allRfps: 'Alle RFPs',
        myRfis: 'Meine RFIs',
        reports: 'Berichte',
        analytics: 'Analytik',
        employees: 'Mitarbeiter',
        settings: 'Einstellungen',
        support: 'Support'
      },
      settings: {
        organizationSettings: 'Organisationseinstellungen',
        language: 'Sprache',
        languageDescription: 'Wählen Sie Ihre bevorzugte Anzeigesprache',
        languageUpdated: 'Sprache Aktualisiert',
        languageUpdateSuccess: 'Ihre Spracheinstellung wurde erfolgreich aktualisiert',
        languageUpdateError: 'Fehler beim Aktualisieren der Spracheinstellung',
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
      },
      rfi: {
        emailAddress: 'E-Mail-Adresse',
        enterEmail: 'Geben Sie Ihre E-Mail-Adresse ein',
        questionMessage: 'Frage/Nachricht',
        enterQuestion: 'Geben Sie Ihre Fragen oder Anfrage für zusätzliche Informationen ein...',
        submitRequest: 'Anfrage einreichen',
        requestSent: 'Anfrage gesendet',
        requestSuccessful: 'Ihre Informationsanfrage wurde erfolgreich eingereicht'
      }
    }
  },
  ja: {
    translation: {
      common: {
        save: '変更を保存',
        cancel: 'キャンセル',
        loading: '読み込み中...',
        uploading: 'アップロード中...',
        submitting: '送信中...',
        appName: 'FindConstructionBids',
        error: 'エラー'
      },
      validation: {
        titleRequired: 'タイトルは必須です',
        descriptionRequired: '説明は必須です',
        jobLocationRequired: '作業場所は必須です',
        walkthroughDateRequired: '現場視察日は必須です',
        rfiDateRequired: 'RFI日付は必須です',
        deadlineRequired: '締切日は必須です',
        validEmail: '有効なメールアドレスを入力してください',
        messageRequired: '質問またはメッセージを入力してください'
      },
      auth: {
        login: 'ログイン',
        logout: 'ログアウト',
        register: '登録',
        email: 'メールアドレス',
        password: 'パスワード',
        forgotPassword: 'パスワードをお忘れですか？',
        rememberMe: 'ログイン情報を保存',
        noAccount: 'アカウントをお持ちでないですか？',
        haveAccount: 'すでにアカウントをお持ちですか？',
        createAccount: 'アカウントを作成',
        loginError: 'メールアドレスまたはパスワードが無効です'
      },
      dashboard: {
        dashboard: 'ダッシュボード',
        myRfps: '私のRFP',
        createRfp: 'RFP作成',
        createNewRfp: '新規RFP作成',
        searchRfps: 'RFPを検索...',
        sortBy: '並び替え...',
        filterByLocation: '場所でフィルター',
        allLocations: 'すべての場所',
        sortOptions: {
          priceLowHigh: 'RFP金額：安い順',
          priceHighLow: 'RFP金額：高い順',
          deadline: '締切日'
        }
      },
      sidebar: {
        myRfps: '私のRFP',
        featuredRfps: '注目のRFP',
        newRfps: '新しいRFP',
        allRfps: 'すべてのRFP',
        myRfis: '私のRFI',
        reports: 'レポート',
        analytics: '分析',
        employees: '従業員',
        settings: '設定',
        support: 'サポート'
      },
      settings: {
        organizationSettings: '組織設定',
        language: '言語',
        languageDescription: 'お好みの表示言語を選択してください',
        languageUpdated: '言語が更新されました',
        languageUpdateSuccess: '言語設定が正常に更新されました',
        languageUpdateError: '言語設定の更新に失敗しました',
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
      },
      rfi: {
        emailAddress: 'メールアドレス',
        enterEmail: 'メールアドレスを入力してください',
        questionMessage: '質問・メッセージ',
        enterQuestion: '質問や追加情報のリクエストを入力してください...',
        submitRequest: 'リクエストを送信',
        requestSent: 'リクエスト送信済み',
        requestSuccessful: '情報リクエストが正常に送信されました'
      }
    }
  },
  zh: {
    translation: {
      common: {
        save: '保存更改',
        cancel: '取消',
        loading: '加载中...',
        uploading: '上传中...',
        submitting: '提交中...',
        appName: 'FindConstructionBids',
        error: '错误'
      },
      validation: {
        titleRequired: '标题是必填项',
        descriptionRequired: '描述是必填项',
        jobLocationRequired: '工作地点是必填项',
        walkthroughDateRequired: '现场查看日期是必填项',
        rfiDateRequired: 'RFI日期是必填项',
        deadlineRequired: '截止日期是必填项',
        validEmail: '请输入有效的电子邮箱地址',
        messageRequired: '请输入您的问题或消息'
      },
      auth: {
        login: '登录',
        logout: '退出登录',
        register: '注册',
        email: '电子邮箱',
        password: '密码',
        forgotPassword: '忘记密码？',
        rememberMe: '记住我',
        noAccount: '没有账户？',
        haveAccount: '已有账户？',
        createAccount: '创建账户',
        loginError: '邮箱或密码无效'
      },
      dashboard: {
        dashboard: '仪表板',
        myRfps: '我的RFP',
        createRfp: '创建RFP',
        createNewRfp: '创建新RFP',
        searchRfps: '搜索RFP...',
        sortBy: '排序方式...',
        filterByLocation: '按位置筛选',
        allLocations: '所有位置',
        sortOptions: {
          priceLowHigh: 'RFP金额：从低到高',
          priceHighLow: 'RFP金额：从高到低',
          deadline: '截止日期'
        }
      },
      sidebar: {
        myRfps: '我的RFP',
        featuredRfps: '精选RFP',
        newRfps: '新RFP',
        allRfps: '所有RFP',
        myRfis: '我的RFI',
        reports: '报告',
        analytics: '分析',
        employees: '员工',
        settings: '设置',
        support: '支持'
      },
      settings: {
        organizationSettings: '组织设置',
        language: '语言',
        languageDescription: '选择您偏好的显示语言',
        languageUpdated: '语言已更新',
        languageUpdateSuccess: '您的语言偏好已成功更新',
        languageUpdateError: '更新语言偏好失败',
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
      },
      rfi: {
        emailAddress: '电子邮箱地址',
        enterEmail: '请输入您的电子邮箱地址',
        questionMessage: '问题/信息',
        enterQuestion: '请输入您的问题或需要的其他信息...',
        submitRequest: '提交请求',
        requestSent: '请求已发送',
        requestSuccessful: '您的信息请求已成功提交'
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