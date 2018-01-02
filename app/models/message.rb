class Message < ApplicationRecord
  belongs_to :room
  belongs_to :user
  has_many :ancestor_relationships, class_name: 'MessageRelationship', foreign_key: :child_id
  has_many :ancestors, through: :ancestor_relationships, source: :parent
  has_many :descendant_relationships, class_name: 'MessageRelationship', foreign_key: :parent_id
  has_many :descendants, through: :descendant_relationships, source: :child

  before_save do
    tags = []
    if content
      content.scan(/(?:\s|^)#(\S+)/) do |tag, _|
        tags << tag
      end
    end
    meta[:tags] = tags
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
    return all if query_string.blank?
    query = parse_query(query_string)
    q = tags(*query[:tags]).no_tags(*query[:no_tags])
    if query[:parent_ids].present?
      q = q.joins(:ancestor_relationships)
    end
    query[:parent_ids].each do |parent_id|
      q = q.where(message_relationships: { parent_id: parent_id})
    end
    q
  }

  def self.parse_query(query)
    {
      tags: query.scan(/(?:\s|^)([^\!\/]\S+)/).map {|tag, _| tag },
      no_tags: query.scan(/(?:\s|^)\!(\S+)/).map {|tag, _| tag },
      parent_ids: query.scan(/(?:\s|^)\/p(\d+)/).map {|parent_id, _| parent_id }
    }
  end
end
