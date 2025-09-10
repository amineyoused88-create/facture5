import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData, Client, InvoiceItem } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLicense } from '../../contexts/LicenseContext';
import { ArrowLeft, Plus, Trash2, Save, Eye, Check, X,FileText } from 'lucide-react';
import { convertNumberToWords } from '../../utils/numberToWords';
import TemplateSelector from '../templates/TemplateSelector';
import TemplateRenderer from '../templates/TemplateRenderer';
import ProTemplateModal from '../license/ProTemplateModal';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { checkLimit, licenseType } = useLicense();
  const { clients, products, addInvoice, getClientById } = useData();
  
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(user?.company?.defaultTemplate || 'template1');
  const [showPreview, setShowPreview] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showUpgradePage, setShowUpgradePage] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 0,
      total: 0
    }
  ]);

  const templates = [
    { id: 'template1', name: 'Classique', isPro: false },
    { id: 'template2', name: 'Moderne Coloré', isPro: true },
    { id: 'template3', name: 'Minimaliste', isPro: true },
    { id: 'template4', name: 'Corporate', isPro: true },
    { id: 'template5', name: 'Premium Élégant', isPro: true }
  ];

  const getTemplateName = (templateId: string) => {
    return templates.find(t => t.id === templateId)?.name || 'Template';
  };

  const isTemplateProOnly = (templateId: string) => {
    return templates.find(t => t.id === templateId)?.isPro || false;
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = getClientById(clientId);
    setSelectedClient(client || null);
  };

  
  
  const getProductBySku = (productName: string) => {
    return products.find(product => product.name === productName);
  };

  const handleProductSelect = (itemId: string, productName: string) => {
    const selectedProduct = products.find(product => product.name === productName);
    
    if (selectedProduct) {
      setItems(items.map(item => {
        if (item.id === itemId) {
          const updatedItem = {
            ...item,
            description: productName,
            unitPrice: selectedProduct.salePrice,
            total: item.quantity * selectedProduct.salePrice,
            unit: selectedProduct.unit || 'unité'
          };
          return updatedItem;
        }
        return item;
      }));
    } else {
      // Si aucun produit sélectionné, réinitialiser
      setItems(items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            description: '',
            unitPrice: 0,
            vatRate: 0,
            total: 0,
            unit: undefined
          };
        }
        return item;
      }));
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 0,
      total: 0,
      unit: undefined
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const vatByRate = items.reduce((acc, item) => {
      const vatAmount = item.total * (item.vatRate / 100);
      acc[item.vatRate] = (acc[item.vatRate] || 0) + vatAmount;
      return acc;
    }, {} as Record<number, number>);
    
    const totalVat = Object.values(vatByRate).reduce((sum, vat) => sum + vat, 0);
    const totalTTC = subtotal + totalVat;

    return { subtotal, vatByRate, totalVat, totalTTC };
  };

  const { subtotal, vatByRate, totalVat, totalTTC } = calculateTotals();

  const handleSave = async () => {
    if (!checkLimit('invoices')) {
      alert('🚨 Vous avez atteint la limite de factures de la version gratuite. Passez à la version Pro pour continuer.');
      return;
    }
    
    if (!selectedClient) {
      alert('Veuillez sélectionner un client');
      return;
    }

    if (items.some(item => !item.description)) {
      alert('Veuillez sélectionner un produit pour tous les articles');
      return;
    }

    setIsLoading(true);
    
    try {
      await addInvoice({
        clientId: selectedClient.id,
        client: selectedClient,
        date: invoiceDate,
        items,
        subtotal,
        totalVat,
        totalTTC,
        status: 'unpaid'
      }, invoiceDate); // Passer la date pour la numérotation
      
      setShowSuccessModal(true);
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate('/invoices');
      }, 2000);
    } catch (error) {
      alert('Erreur lors de la création de la facture');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>



      
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('createInvoice')}</h1>
        </div>

 {/* Modal pour signature manquante */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">🖋️ Signature électronique manquante</h3>
                  <button
                    onClick={() => setShowSignatureModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Aucune signature enregistrée
                  </h3>
                  <p className="text-gray-600">
                    Pour ajouter votre signature sur les factures, vous devez d'abord l'enregistrer dans vos paramètres.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-900 mb-2">📝 Étapes pour ajouter votre cachet :</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Écrivez votre cachet sur une feuille blanche et prenez une photo</li>
                    <li>2. Rendez-vous sur <a href="https://remove.bg" target="_blank" rel="noopener noreferrer" className="underline font-medium">remove.bg</a> pour supprimer l'arrière-plan</li>
                    <li>3. Importez votre image sur <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">imgbb.com</a> pour l'héberger</li>
                    <li>4. Copiez le lien direct de votre image et collez-le dans vos paramètres</li>
                  </ol>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowSignatureModal(false);
                      entrepriseId: user?.isAdmin ? user.id : user.entrepriseId || ''
                    }}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    Ajouter maintenant
                  </button>
                  <button
                    onClick={() => setShowSignatureModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



        
        
        <div className="flex space-x-3">
        
          <label className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={includeSignature}
              onChange={(e) => {
                if (e.target.checked && !user?.company?.signature) {
                  setShowSignatureModal(true);
                  setIncludeSignature(false);
                } else {
                  setIncludeSignature(e.target.checked);
                }
              }}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium">Ajouter ma signature électronique</span>
          </label>
          
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Entreprise</h3>
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">{user?.company.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{user?.company.address}</p>
                  <p className="text-sm text-gray-600">{user?.company.phone}</p>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">ICE:</span> {user?.company.ice}</p>
                  <p><span className="font-medium">IF:</span> {user?.company.if}</p>
                  <p><span className="font-medium">RC:</span> {user?.company.rc}</p>
                  <p><span className="font-medium">CNSS:</span> {user?.company.cnss}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Template Selection */}
       

          {/* Invoice Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Facture</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'émission
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Client</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un client *
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Choisir un client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - ICE: {client.ice}
                  </option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg p-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedClient.name}</h4>
                  <p className="text-sm text-gray-600 mb-1">{selectedClient.address}</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">ICE:</span> {selectedClient.ice}</p>
                </div>
              </div>
            )}

            {clients.length === 0 && (
              <div>
                <p className="text-gray-500 text-center py-4">
                  Aucun client enregistré. Veuillez d'abord ajouter des clients dans la section Clients.
                </p>
              </div>
            )}
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Articles/Services</h3>
              <button
                onClick={addItem}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>

            {products.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-amber-800 text-sm">
                  ⚠️ Aucun produit enregistré. Veuillez d'abord ajouter des produits dans la section Produits pour pouvoir créer une facture.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Article #{index + 1}</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-12">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Produit *
                      </label>
                      <select
                        value={item.description}
                        onChange={(e) => handleProductSelect(item.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un produit...</option>
                        {products.map(product => (
                          <option key={product.id} value={product.name}>
                            {product.name} - {product.salePrice.toFixed(2)} MAD ({product.unit || 'unité'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Première ligne: Quantité et Prix unitaire */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantité ({getProductBySku(item.description)?.unit || 'unité'})
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder={`Ex: 25 ${getProductBySku(item.description)?.unit || 'unité'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Prix unit. HT (MAD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                  
                  {/* Deuxième ligne: TVA et Total */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        TVA
                      </label>
                      <select
                        value={item.vatRate}
                        onChange={(e) => updateItem(item.id, 'vatRate', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value={0}>0% (Exonéré)</option>
                        <option value={7}>7% (Produits alimentaires)</option>
                        <option value={10}>10% (Hôtellerie)</option>
                        <option value={20}>20% (Taux normal)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total HT (MAD)
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-900">
                        {item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {/* SKU en petit en bas */}
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">
                      SKU: {getProductBySku(item.description)?.sku || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total HT</span>
                <span className="font-medium">{subtotal.toFixed(2)} MAD</span>
              </div>
              
              {Object.entries(vatByRate).map(([rate, amount]) => (
                <div key={rate} className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA {rate}%</span>
                  <span className="font-medium">{amount.toFixed(2)} MAD</span>
                </div>
              ))}
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Total TTC</span>
                  <span className="text-lg font-bold text-teal-600">{totalTTC.toFixed(2)} MAD</span>
                </div>
              </div>
              
              {/* Montant en lettres */}
              <div className="border-t border-gray-200 pt-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-900 mb-1">Montant en lettres:</p>
                  <p className="text-sm text-blue-800 font-medium">
                    {convertNumberToWords(totalTTC)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                Cette facture sera conforme à la réglementation fiscale marocaine avec toutes les mentions légales obligatoires.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all duration-500 transform bg-white shadow-2xl rounded-2xl animate-bounce">
              {/* Header avec animation */}
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-emerald-400 animate-pulse opacity-50"></div>
                
                {/* Étoiles flottantes */}
                <div className="absolute top-2 left-4 animate-bounce">
                  <div className="w-6 h-6 text-yellow-200">✨</div>
                </div>
                <div className="absolute top-4 right-6 animate-bounce" style={{ animationDelay: '0.5s' }}>
                  <div className="w-4 h-4 text-yellow-200">⭐</div>
                </div>
                <div className="absolute bottom-2 right-4 animate-bounce" style={{ animationDelay: '1s' }}>
                  <div className="w-5 h-5 text-yellow-200">✨</div>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                    <Check className="w-8 h-8 animate-bounce" />
                  </div>
                </div>
              </div>

              {/* Contenu principal */}
              <div className="p-8 text-center">
                {/* Icône de succès avec animation */}
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Check className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 animate-pulse">
                  🎉 Facture créée avec succès !
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Votre facture a été enregistrée et est maintenant disponible dans la liste des factures.
                </p>
                {/* Barre de progression */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
                
                <p className="text-sm text-gray-500">
                  Redirection automatique vers la liste des factures...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Aperçu de la facture</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[80vh] overflow-y-auto">
                <TemplateRenderer 
                  templateId={selectedTemplate}
                  data={{
                    id: 'preview',
                    number: 'PREVIEW-001',
                    clientId: selectedClient.id,
                    client: selectedClient,
                    date: invoiceDate,
                    items,
                    subtotal,
                    totalVat,
                    totalTTC,
                    status: 'draft',
                    createdAt: new Date().toISOString(),
                    entrepriseId: user?.id || ''
                  }}
                  type="invoice"
                />
              </div>
            </div>
          </div>
        </div>
      )}

   
      {/* Modal Pro Template */}
      {showProModal && (
        <ProTemplateModal
          isOpen={showProModal}
          onClose={() => setShowProModal(false)}
          templateName={getTemplateName(selectedTemplate)}
        />
      )}

      {/* Page d'upgrade */}
      {showUpgradePage && (
        <div className="fixed inset-0 z-[60] bg-gray-500 bg-opacity-75">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4">Passez à la version Pro</h3>
                <p className="text-gray-600 mb-6">
                  Débloquez tous les templates premium et fonctionnalités avancées !
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUpgradePage(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg">
                    Acheter Pro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
