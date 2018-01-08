class Message < ApplicationRecord
  belongs_to :room
  belongs_to :user
  has_many :ancestor_relationships, class_name: 'MessageRelationship', foreign_key: :child_id
  has_many :ancestors, through: :ancestor_relationships, source: :parent
  has_many :descendant_relationships, class_name: 'MessageRelationship', foreign_key: :parent_id
  has_many :descendants, through: :descendant_relationships, source: :child

  before_save do
    tags = []
    urls = []
    if content
      content.scan(/(?:\s|^)#(\S+)/) do |tag, _|
        tags << tag
      end
      urls = URI.extract(content)
    end
    meta.update(tags: tags, urls: urls)
  end

  def first_line
    content.split(/\n/).first
  end

  scope :tags, -> (*tags) {
    return all if tags.blank?
    where('meta->\'tags\' @> ?', tags.to_json)
  }
  scope :no_tags, -> (*tags) {
    return all if tags.blank?
    q = all
    tags.each do |tag|
      q = q.where.not('meta->\'tags\' @> ?', [tag].to_json)
    end
    q.or(where('meta->\'tags\' is NULL'))
  }

  scope :query, -> (query_string) {
    query = parse_query(query_string)
    q = tags(*query[:tags]).no_tags(*query[:no_tags])
    if query[:parent_ids].present?
      q = q.joins(:ancestor_relationships)
    end
    query[:parent_ids].each do |parent_id|
      q = q.where(message_relationships: { parent_id: parent_id})
    end
    query[:orders].each do |order|
      dir, colomn = order.match(/^([+-]?)(.*)$/)[1..2]
      if dir == '-'
        q = q.order(colomn => :asc)
      else
        q = q.order(colomn => :desc)
      end
    end
    q
  }

  def self.parse_query(query)
    query = "" if query.nil?
    {
      tags: query.scan(/(?:\s|^)([^\!\/+-]\S+)/).map(&:first),
      no_tags: query.scan(/(?:\s|^)\!(\S+)/).map(&:first),
      parent_ids: query.scan(/(?:\s|^)\/p(\d+)/).map(&:first),
      orders: query.scan(/(?:\s|^)([+-]\S+)/).map(&:first)
    }
  end
end
