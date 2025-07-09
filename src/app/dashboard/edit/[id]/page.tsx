'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useGitHubRepos } from '@/hooks/useGitHubRepos'
import { usePortfolioEditor } from '@/hooks/usePortfolioEditor'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

interface EditPortfolioPageProps {
  params: Promise<{
    id: string
  }>
}

// Template ID mapping
const templateNameToId = {
  'modern-developer': 1,
  'creative-portfolio': 2,
  'professional-tech': 3
}

const templateIdToName = {
  1: 'modern-developer',
  2: 'creative-portfolio',
  3: 'professional-tech'
}

const templateDisplayNames = {
  1: 'Modern Developer',
  2: 'Creative Portfolio', 
  3: 'Professional Tech'
}

export default function EditPortfolioPage({ params }: EditPortfolioPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const resolvedParams = use(params)
  const portfolioId = resolvedParams.id
  
  // Portfolio data hook
  const { portfolio, loading: portfolioLoading, error: portfolioError, updatePortfolio } = usePortfolioEditor(portfolioId)
  
  // GitHub repos hook
  const { repos: allRepos, loading: reposLoading } = useGitHubRepos()
  
  // Form state
  const [selectedRepos, setSelectedRepos] = useState<number[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Demo mode kontrolü
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  // Session check
  useEffect(() => {
    if (!session) {
      router.push('/')
    }
  }, [session, router])

  // Portfolio verisi yüklendiğinde form state'ini doldur
  useEffect(() => {
    if (portfolio && allRepos.length > 0) {
      console.log('📋 Portfolio verisi form state\'ine aktarılıyor:', portfolio)
      
      // Template'i ayarla
      const templateId = templateNameToId[portfolio.template as keyof typeof templateNameToId]
      if (templateId) {
        setSelectedTemplate(templateId)
      }
      
      // Seçili repoları ayarla - repo isimlerini ID'lere çevir
      const repoIds = portfolio.selectedRepos
        .map(repoName => allRepos.find(repo => repo.name === repoName)?.id)
        .filter(Boolean) as number[]
      
      setSelectedRepos(repoIds)
      console.log('📋 Seçili repolar güncellendi:', repoIds)
    }
  }, [portfolio, allRepos])

  const toggleRepo = (repoId: number) => {
    setSelectedRepos(prev => 
      prev.includes(repoId) 
        ? prev.filter(id => id !== repoId)
        : [...prev, repoId]
    )
  }

  const handleSave = async () => {
    if (!portfolio) return
    
    setSaving(true)
    setSaveSuccess(false)
    
    try {
      console.log('💾 Portfolio kaydediliyor...')
      
      // Seçili repo ID'lerini isimlere çevir
      const selectedRepoNames = selectedRepos
        .map(repoId => allRepos.find(repo => repo.id === repoId)?.name)
        .filter(Boolean) as string[]
      
      const updateData = {
        template: templateIdToName[selectedTemplate as keyof typeof templateIdToName],
        selectedRepos: selectedRepoNames
      }
      
      const success = await updatePortfolio(updateData)
      
      if (success) {
        setSaveSuccess(true)
        console.log('✅ Portfolio başarıyla kaydedildi!')
        
        // 2 saniye sonra portfolyolarım sayfasına yönlendir
        setTimeout(() => {
          router.push('/my-portfolios')
        }, 2000)
      }
    } catch (error) {
      console.error('❌ Portfolio kaydetme hatası:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleViewPortfolio = () => {
    const portfolioUrl = `/portfolio/${portfolioId}`
    window.open(portfolioUrl, '_blank')
  }

  // Loading state
  if (portfolioLoading || !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader demoMode={demoMode} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Portfolio yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (portfolioError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader demoMode={demoMode} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-800 mb-4">Hata</h2>
            <p className="text-red-700 mb-6">{portfolioError}</p>
            <button 
              onClick={() => router.push('/my-portfolios')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Portfolyolarıma Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!portfolio) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader demoMode={demoMode} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolyo Düzenle</h1>
          <p className="text-gray-600">
            Portfolyonuzun projelerini ve template'ini güncelleyin
          </p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="text-green-600 text-xl mr-3">✅</div>
              <div>
                <h3 className="text-green-800 font-semibold">Başarılı!</h3>
                <p className="text-green-700">Portfolio başarıyla güncellendi. Portfolyolarım sayfasına yönlendiriliyorsunuz...</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Template Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Template Seçimi</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((templateId) => (
                  <div
                    key={templateId}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTemplate === templateId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(templateId)}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        {templateId === 1 && '🎯'}
                        {templateId === 2 && '🎨'}
                        {templateId === 3 && '🏢'}
                      </div>
                      <h3 className="font-semibold">{templateDisplayNames[templateId as keyof typeof templateDisplayNames]}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {templateId === 1 && 'Modern ve minimalist'}
                        {templateId === 2 && 'Yaratıcı ve renkli'}
                        {templateId === 3 && 'Profesyonel ve kurumsal'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Repository Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Proje Seçimi ({selectedRepos.length} seçili)
              </h2>
              
              {reposLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Projeler yükleniyor...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {allRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedRepos.includes(repo.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleRepo(repo.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm break-words flex-1 mr-2">{repo.name}</h3>
                        <input
                          type="checkbox"
                          checked={selectedRepos.includes(repo.id)}
                          onChange={() => {}}
                          className="h-4 w-4 text-blue-600 rounded flex-shrink-0"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-3 break-words">
                        {repo.description || 'No description available'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="truncate mr-2">{repo.language || 'Unknown'}</span>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span>⭐ {repo.stargazers_count}</span>
                          <span>🍴 {repo.forks_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Current Portfolio Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Mevcut Portfolio</h3>
              <div className="space-y-3 text-sm">
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-600 font-medium">Template:</span>
                  <span className="text-gray-900 break-words">{templateDisplayNames[templateNameToId[portfolio.template as keyof typeof templateNameToId] as keyof typeof templateDisplayNames]}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-600 font-medium">Proje Sayısı:</span>
                  <span className="text-gray-900">{portfolio.selectedRepos.length}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-600 font-medium">Son Güncelleme:</span>
                  <span className="text-gray-900 break-words">
                    {new Date(portfolio.updatedAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">İşlemler</h3>
              <div className="space-y-3">
                <button
                  onClick={handleViewPortfolio}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  👁️ Portfolyoyu Görüntüle
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={saving || selectedRepos.length === 0}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    '💾 Değişiklikleri Kaydet'
                  )}
                </button>
                
                <button
                  onClick={() => router.push('/my-portfolios')}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ← Geri Dön
                </button>
              </div>
              
              {selectedRepos.length === 0 && (
                <p className="text-red-600 text-sm mt-3">
                  ⚠️ En az bir proje seçmelisiniz
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 