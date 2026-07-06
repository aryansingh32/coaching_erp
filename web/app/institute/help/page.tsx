"use client"

import { useState } from "react"
import DOMPurify from "dompurify"
import { useHelpCategories, useHelpArticles } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Search, HelpCircle, Book, ChevronRight } from "lucide-react"

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()

  const { data: categories, isLoading: categoriesLoading } = useHelpCategories()
  const { data: articles, isLoading: articlesLoading } = useHelpArticles(selectedCategory, debouncedSearch)

  // Use a simple debounce for the search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setTimeout(() => {
      setDebouncedSearch(e.target.value)
    }, 500)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight">How can we help?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Search our knowledge base or browse categories to find answers to your questions.
        </p>
        
        <div className="max-w-2xl mx-auto mt-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            className="w-full pl-12 h-14 text-lg rounded-full shadow-sm bg-background border-primary/20 focus-visible:ring-primary/30"
            placeholder="Search for articles..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      {!debouncedSearch && !selectedCategory && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            Browse Categories
          </h3>
          
          {categoriesLoading ? (
            <LoadingState />
          ) : !categories || categories.length === 0 ? (
            <EmptyState title="No categories found" />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat, idx) => (
                <Card 
                  key={idx} 
                  className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/40 group"
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center justify-between">
                      {cat.category_name || cat.name}
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </CardTitle>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {(debouncedSearch || selectedCategory) && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Book className="w-5 h-5 text-primary" />
              {debouncedSearch ? `Search Results for "${debouncedSearch}"` : `Articles in ${selectedCategory}`}
            </h3>
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(undefined)}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear category
              </button>
            )}
          </div>

          {articlesLoading ? (
            <LoadingState />
          ) : !articles || articles.length === 0 ? (
            <EmptyState title="No articles found" description="Try adjusting your search terms or category filter." />
          ) : (
            <div className="space-y-4">
              {articles.map((article, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">{article.title || article.name}</CardTitle>
                    {article.author && <p className="text-xs text-muted-foreground">By {article.author}</p>}
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }} 
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
